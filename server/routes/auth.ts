import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { TextEncoder } from "node:util";
import { type Request, Router } from "express";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { getSupabase } from "../db.js";

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
  password_hash: string;
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

function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
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

  if (error) throw error;
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

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, fullName } = emailSignupSchema.parse(req.body);
    const supabase = getSupabase();

    const { data: existingAccount, error: existingError } = await supabase
      .from("email_accounts")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingAccount) {
      return res.status(409).json({ error: "An account already exists for this email." });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        wallet_address: `email:${email}`,
        display_name: fullName,
      })
      .select("id, wallet_address, display_name, avatar_url")
      .single();

    if (profileError) throw profileError;

    const userProfile = profile as ProfileRow;
    const { error: accountError } = await supabase.from("email_accounts").insert({
      email,
      profile_id: userProfile.id,
      password_hash: createPasswordHash(password),
    });

    if (accountError) throw accountError;

    const token = signProfileToken(userProfile, { email });
    await recordAuthRecognition(req, userProfile.id);
    return res.status(201).json({ token, profile: userProfile });
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
    const supabase = getSupabase();

    const { data: account, error } = await supabase
      .from("email_accounts")
      .select("email, password_hash, profiles(id, wallet_address, display_name, avatar_url)")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    const emailAccount = account as EmailAccountRow | null;
    if (
      !emailAccount ||
      !emailAccount.profiles ||
      !verifyPassword(password, emailAccount.password_hash)
    ) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signProfileToken(emailAccount.profiles, { email });
    await recordAuthRecognition(req, emailAccount.profiles.id);
    return res.json({ token, profile: emailAccount.profiles });
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
