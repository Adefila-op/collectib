import { createHash, randomBytes } from "node:crypto";
import { TextEncoder } from "node:util";
import { type Request, Router } from "express";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { createSupabaseAuthClient, getSupabase } from "../db.js";

const router = Router();

const walletSchema = z.object({
  walletAddress: z.string().min(32).max(64),
});

const verifySchema = walletSchema.extend({
  signature: z.union([z.string(), z.array(z.number().int().min(0).max(255))]),
});

const emailAuthSchema = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

const emailSignupSchema = emailAuthSchema.extend({
  fullName: z.string().trim().min(2).max(80),
});

const recognitionSchema = z.object({
  deviceId: z.string().trim().min(8).max(128).optional(),
});

const tokenSchema = z.object({
  token: z.string().trim().min(16).max(4096),
  refreshToken: z.string().trim().min(16).max(4096).optional(),
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((email) => email.trim().toLowerCase()),
});

const resetPasswordSchema = forgotPasswordSchema.extend({
  accessToken: z.string().trim().min(16).max(4096),
  refreshToken: z.string().trim().min(16).max(4096),
  password: z.string().min(8).max(128),
});

type NonceRow = {
  message: string;
  expires_at: string;
};

type ProfileRow = {
  id: string;
  wallet_address: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

type EmailAccountRow = {
  email: string;
  email_verified_at?: string | null;
  profiles: ProfileRow | null;
};

type JwtPayload = {
  sub?: string;
  email?: string;
  walletAddress?: string;
};

function buildLoginMessage(walletAddress: string, nonce: string) {
  return [
    "Sign in to Everyone's Art Portfolio.",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    "This signature proves wallet ownership and does not authorize a transaction.",
  ].join("\n");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "";
}

function isMissingSchemaError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : "";
  return (
    code === "42P01" ||
    code === "42703" ||
    message.includes("could not find") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function throwDbError(error: unknown) {
  if (!error) return;
  throw new Error(getErrorMessage(error) || "Database request failed.");
}

function signProfileToken(profile: ProfileRow, extra: { email?: string } = {}) {
  requireEnv("jwtSecret");

  return jwt.sign(
    {
      sub: profile.id,
      walletAddress: profile.wallet_address,
      ...extra,
    },
    config.jwtSecret,
    { expiresIn: "7d" },
  );
}

function hashIpAddress(ipAddress: string | undefined) {
  if (!ipAddress) return null;
  return createHash("sha256").update(ipAddress).digest("base64url");
}

function getAuthDeviceId(req: Request) {
  const header = req.get("x-auth-device-id");
  const parsed = recognitionSchema.safeParse({ deviceId: header });
  return parsed.success ? parsed.data.deviceId : undefined;
}

function getRecognitionKeys(req: Request, bodyDeviceId?: string) {
  const deviceId = bodyDeviceId ?? getAuthDeviceId(req);
  const ipHash = hashIpAddress(req.ip);
  return [
    deviceId ? { recognition_key: `device:${deviceId}`, kind: "device" } : null,
    ipHash ? { recognition_key: `ip:${ipHash}`, kind: "ip" } : null,
  ].filter((key): key is { recognition_key: string; kind: "device" | "ip" } => Boolean(key));
}

async function recordAuthRecognition(req: Request, profileId: string) {
  const keys = getRecognitionKeys(req);
  if (keys.length === 0) return;

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase.from("auth_recognitions").upsert(
    keys.map((key) => ({
      ...key,
      profile_id: profileId,
      last_seen_at: now,
    })),
    { onConflict: "recognition_key" },
  );

  if (error) {
    if (isMissingSchemaError(error)) return;
    throwDbError(error);
  }
}

function getOptionalSession(req: { headers: { authorization?: string } }) {
  if (!config.jwtSecret) return null;

  const authorization = req.headers.authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

function authRedirect(path: string) {
  return `${config.publicAppUrl.replace(/\/$/, "")}${path}`;
}

async function syncEmailProfile(email: string, fullName?: string | null, verifiedAt?: string | null) {
  const supabase = getSupabase();
  const walletAddress = `email:${email}`;
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id, wallet_address, display_name, avatar_url")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (existingProfileError) throw existingProfileError;

  let profile = existingProfile as ProfileRow | null;

  if (!profile) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        wallet_address: walletAddress,
        display_name: fullName || email.split("@")[0],
      })
      .select("id, wallet_address, display_name, avatar_url")
      .single();

    if (error) throw error;
    profile = data as ProfileRow;
  } else if (fullName && !profile.display_name) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select("id, wallet_address, display_name, avatar_url")
      .single();

    if (error) throw error;
    profile = data as ProfileRow;
  }

  const now = new Date().toISOString();
  const { error: accountError } = await supabase.from("email_accounts").upsert(
    {
      email,
      profile_id: profile.id,
      password_hash: "supabase-auth",
      email_verified_at: verifiedAt ?? null,
      updated_at: now,
    },
    { onConflict: "email" },
  );

  if (accountError) throw accountError;

  return profile;
}

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, fullName } = emailSignupSchema.parse(req.body);
    const auth = createSupabaseAuthClient();

    const { data, error } = await auth.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: authRedirect(`/verify-email?email=${encodeURIComponent(email)}`),
      },
    });

    if (error) {
      const message = error.message || "Could not create Supabase account.";
      const status = /already|registered|exists/i.test(message) ? 409 : 400;
      return res.status(status).json({ error: message });
    }

    const userProfile = await syncEmailProfile(email, fullName, data.user?.email_confirmed_at ?? null);
    if (data.session) {
      const token = signProfileToken(userProfile, { email });
      await recordAuthRecognition(req, userProfile.id);
      return res.status(201).json({ token, profile: userProfile });
    }

    return res.status(201).json({
      needsVerification: true,
      email,
      message: "Check your email for the Supabase verification link.",
      profile: userProfile,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = tokenSchema.parse(req.body);
    const auth = createSupabaseAuthClient();
    const { data, error } = await auth.auth.getUser(token);

    if (error || !data.user?.email) {
      return res.status(400).json({ error: error?.message || "Verification link is invalid or expired." });
    }

    const email = data.user.email.toLowerCase();
    const profile = await syncEmailProfile(
      email,
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : null,
      data.user.email_confirmed_at ?? new Date().toISOString(),
    );
    const sessionToken = signProfileToken(profile, { email });
    await recordAuthRecognition(req, profile.id);
    return res.json({ token: sessionToken, profile });
  } catch (error) {
    next(error);
  }
});

router.post("/recognition", async (req, res, next) => {
  try {
    const { deviceId } = recognitionSchema.parse(req.body ?? {});
    const keys = getRecognitionKeys(req, deviceId);

    if (keys.length === 0) {
      return res.json({ recognized: false });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("auth_recognitions")
      .select("recognition_key")
      .in(
        "recognition_key",
        keys.map((key) => key.recognition_key),
      )
      .limit(1);

    if (error) throw error;

    return res.json({ recognized: Boolean(data?.length) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = emailAuthSchema.parse(req.body);
    const auth = createSupabaseAuthClient();

    const { data, error } = await auth.auth.signInWithPassword({ email, password });
    if (error || !data.user?.email) {
      const message = error?.message || "Invalid email or password.";
      const status = /confirm|verified/i.test(message) ? 403 : 401;
      return res.status(status).json({ error: message });
    }

    const profile = await syncEmailProfile(
      email,
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : null,
      data.user.email_confirmed_at ?? new Date().toISOString(),
    );
    const token = signProfileToken(profile, { email });
    await recordAuthRecognition(req, profile.id);
    return res.json({ token, profile });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const auth = createSupabaseAuthClient();
    const { error } = await auth.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirect(`/reset-password?email=${encodeURIComponent(email)}`),
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      message: "If an account exists for that email, Supabase has sent a reset link.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, accessToken, refreshToken, password } = resetPasswordSchema.parse(req.body);
    const auth = createSupabaseAuthClient();
    const { error: sessionError } = await auth.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) return res.status(400).json({ error: sessionError.message });

    const { data, error } = await auth.auth.updateUser({ password });

    if (error || !data.user?.email) {
      return res.status(400).json({ error: error?.message || "Reset link is invalid or expired." });
    }

    const verifiedAt = data.user.email_confirmed_at ?? new Date().toISOString();
    const profile = await syncEmailProfile(email, null, verifiedAt);
    const sessionToken = signProfileToken(profile, { email });
    await recordAuthRecognition(req, profile.id);
    return res.json({ token: sessionToken, profile });
  } catch (error) {
    next(error);
  }
});

router.post("/nonce", async (req, res, next) => {
  try {
    const { walletAddress } = walletSchema.parse(req.body);
    const nonce = randomBytes(24).toString("base64url");
    const message = buildLoginMessage(walletAddress, nonce);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabase = getSupabase();
    const { error } = await supabase.from("wallet_nonces").upsert(
      {
        wallet_address: walletAddress,
        nonce,
        message,
        expires_at: expiresAt,
      },
      { onConflict: "wallet_address" },
    );

    if (error) throw error;

    return res.json({ walletAddress, nonce, message, expiresAt });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { walletAddress, signature } = verifySchema.parse(req.body);

    const supabase = getSupabase();
    const { data: nonceRow, error: nonceError } = await supabase
      .from("wallet_nonces")
      .select("message, expires_at")
      .eq("wallet_address", walletAddress)
      .single();

    if (nonceError || !nonceRow) {
      return res.status(401).json({ error: "No login nonce found for this wallet." });
    }

    const nonce = nonceRow as NonceRow;

    if (new Date(nonce.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: "Login nonce expired." });
    }

    const signatureBytes =
      typeof signature === "string" ? bs58.decode(signature) : Uint8Array.from(signature);
    const publicKeyBytes = bs58.decode(walletAddress);
    const messageBytes = new TextEncoder().encode(nonce.message);
    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isValid) {
      return res.status(401).json({ error: "Signature verification failed." });
    }

    const session = getOptionalSession(req);
    let userProfile: ProfileRow;

    if (session?.sub) {
      const { data: existingWalletOwner, error: existingWalletError } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (existingWalletError) throw existingWalletError;
      if (existingWalletOwner && existingWalletOwner.id !== session.sub) {
        return res
          .status(409)
          .json({ error: "This wallet is already connected to another account." });
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({ wallet_address: walletAddress, updated_at: new Date().toISOString() })
        .eq("id", session.sub)
        .select("id, wallet_address, display_name, avatar_url")
        .single();

      if (profileError) throw profileError;
      userProfile = profile as ProfileRow;
    } else {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .upsert({ wallet_address: walletAddress }, { onConflict: "wallet_address" })
        .select("id, wallet_address, display_name, avatar_url")
        .single();

      if (profileError) throw profileError;
      userProfile = profile as ProfileRow;
    }

    await supabase.from("wallet_nonces").delete().eq("wallet_address", walletAddress);

    await supabase.from("connected_wallets").upsert(
      {
        wallet_address: walletAddress,
        profile_id: userProfile.id,
        chain: "solana",
        last_connected_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address" },
    );

    const token = signProfileToken(userProfile, session?.email ? { email: session.email } : {});
    await recordAuthRecognition(req, userProfile.id);

    return res.json({ token, profile: userProfile });
  } catch (error) {
    next(error);
  }
});

export default router;
