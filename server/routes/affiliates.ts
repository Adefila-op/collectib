import { createHash } from "node:crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { createSupabaseAuthClient, getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import type { AuthedRequest } from "../types.js";

const router = Router();
const COMMISSION_RATE = 0.05;
const LEAD_LIMIT = 5;
const CLICK_RATE_LIMIT_WINDOW_MS = 60_000;
const CLICK_RATE_LIMIT_MAX = 30;
const clickRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkClickRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = clickRateLimit.get(ip);
  if (!entry || now >= entry.resetAt) {
    clickRateLimit.set(ip, { count: 1, resetAt: now + CLICK_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= CLICK_RATE_LIMIT_MAX;
}

function isAdmin(req: AuthedRequest): boolean {
  return Boolean(req.user?.walletAddress && config.adminWallets.includes(req.user.walletAddress));
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z
    .string()
    .email()
    .max(254)
    .transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(40).optional(),
  role: z.enum(["affiliate", "lead"]).default("affiliate"),
  leadCode: z.string().trim().max(32).optional(),
});

const campaignSchema = z.object({
  artworkId: z.string().uuid(),
});

const clickSchema = z.object({
  affiliateCode: z.string().trim().min(4).max(32),
  artworkId: z.string().uuid(),
  visitorKey: z.string().trim().max(120).optional(),
});

type ProfileRow = {
  id: string;
  wallet_address: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

type AffiliateAccountRow = {
  profile_id: string;
  lead_profile_id?: string | null;
  role: "affiliate" | "lead";
  status: "pending" | "approved" | "suspended";
  affiliate_code: string;
  phone?: string | null;
  profiles?: ProfileRow | null;
};

type CampaignRow = {
  id: string;
  affiliate_profile_id: string;
  artwork_id: string;
  artworks?: {
    id: string;
    title: string;
    price_amount: number | string;
    price_currency: string;
    image_url?: string | null;
    status: string;
    artists?: { name?: string | null } | null;
  } | null;
};

type CommissionRow = {
  id: string;
  order_id?: string | null;
  artwork_id: string;
  amount: number | string;
  currency: string;
  status: string;
  protection_ends_at?: string | null;
  created_at?: string;
  orders?: {
    id: string;
    status: string;
    amount: number | string;
    currency: string;
    created_at?: string;
    artworks?: { title?: string | null; image_url?: string | null } | null;
  } | null;
};

function affiliateCodeFor(profileId: string, role: "affiliate" | "lead") {
  const prefix = role === "lead" ? "LEAD" : "AFF";
  const digest = createHash("sha256").update(`${role}:${profileId}`).digest("base64url");
  return `${prefix}-${digest.replace(/[^a-z0-9]/gi, "").slice(0, 7).toUpperCase()}`;
}

function authRedirect(path: string) {
  return `${config.publicAppUrl.replace(/\/$/, "")}${path}`;
}

function signProfileToken(profile: ProfileRow, email: string) {
  requireEnv("jwtSecret");
  return jwt.sign(
    {
      sub: profile.id,
      walletAddress: profile.wallet_address,
      email,
    },
    config.jwtSecret,
    { expiresIn: "7d" },
  );
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
  } else if (fullName && profile.display_name !== fullName) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select("id, wallet_address, display_name, avatar_url")
      .single();

    if (error) throw error;
    profile = data as ProfileRow;
  }

  const { error: accountError } = await supabase.from("email_accounts").upsert(
    {
      email,
      profile_id: profile.id,
      password_hash: "supabase-auth",
      email_verified_at: verifiedAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (accountError) throw accountError;
  return profile;
}

async function getAccount(profileId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("affiliate_accounts")
    .select("*, profiles(id, wallet_address, display_name, avatar_url)")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw error;
  return data as AffiliateAccountRow | null;
}

async function requireAffiliate(profileId: string) {
  const account = await getAccount(profileId);
  if (!account) {
    throw new Error("This account is not registered as an affiliate.");
  }
  if (!["approved", "pending"].includes(account.status)) {
    throw new Error("This affiliate account is not approved.");
  }
  return account;
}

async function upsertAffiliateAccount(payload: {
  profileId: string;
  role: "affiliate" | "lead";
  leadProfileId?: string | null;
  phone?: string | null;
}) {
  const supabase = getSupabase();
  const affiliateCode = affiliateCodeFor(payload.profileId, payload.role);
  const { data, error } = await supabase
    .from("affiliate_accounts")
    .upsert(
      {
        profile_id: payload.profileId,
        lead_profile_id: payload.role === "affiliate" ? payload.leadProfileId : null,
        role: payload.role,
        status: "pending",
        affiliate_code: affiliateCode,
        phone: payload.phone ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as AffiliateAccountRow;
}

async function createCommissionForOrder(order: {
  id: string;
  artwork_id: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  amount: number | string;
  currency: string;
  affiliate_profile_id?: string | null;
}) {
  if (!order.affiliate_profile_id) return;
  if ([order.buyer_profile_id, order.seller_profile_id].includes(order.affiliate_profile_id)) return;

  const supabase = getSupabase();
  const account = await getAccount(order.affiliate_profile_id);
  if (!account || account.status !== "approved") return;

  await supabase.from("affiliate_commissions").upsert(
    {
      affiliate_profile_id: account.profile_id,
      lead_profile_id: account.lead_profile_id ?? null,
      order_id: order.id,
      artwork_id: order.artwork_id,
      amount: Number(order.amount) * COMMISSION_RATE,
      currency: order.currency,
      status: "pending_payment",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "order_id" },
  );
}

export async function markAffiliateOrderPaid(orderId: string) {
  const supabase = getSupabase();
  await supabase
    .from("affiliate_commissions")
    .update({
      status: "pending",
      protection_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("status", "pending_payment");
}

export async function attachAffiliateToOrder(order: {
  id: string;
  artwork_id: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  amount: number | string;
  currency: string;
  affiliateCode?: string | null;
}) {
  const code = order.affiliateCode?.trim();
  if (!code) return {};

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("affiliate_accounts")
    .select("*")
    .eq("affiliate_code", code)
    .eq("status", "approved")
    .maybeSingle();

  if (error) throw error;
  const account = data as AffiliateAccountRow | null;
  if (!account) return {};
  if ([order.buyer_profile_id, order.seller_profile_id].includes(account.profile_id)) return {};

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({
      affiliate_profile_id: account.profile_id,
      affiliate_code: account.affiliate_code,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .select("*")
    .single();

  if (updateError) throw updateError;
  await createCommissionForOrder(updated as Parameters<typeof createCommissionForOrder>[0]);
  return { affiliateProfileId: account.profile_id, affiliateCode: account.affiliate_code };
}

router.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const supabase = getSupabase();

    let leadProfileId: string | null = null;
    if (payload.role === "affiliate" && payload.leadCode) {
      const { data: lead, error: leadError } = await supabase
        .from("affiliate_accounts")
        .select("profile_id")
        .eq("affiliate_code", payload.leadCode)
        .eq("role", "lead")
        .eq("status", "approved")
        .maybeSingle();

      if (leadError) throw leadError;
      if (!lead) return res.status(404).json({ error: "Lead invitation code was not found." });
      leadProfileId = String(lead.profile_id);
    }

    if (payload.role === "lead") {
      const { count, error } = await supabase
        .from("affiliate_accounts")
        .select("profile_id", { count: "exact", head: true })
        .eq("role", "lead")
        .eq("status", "approved");

      if (error) throw error;
      if ((count ?? 0) >= LEAD_LIMIT) {
        return res.status(409).json({ error: "All lead affiliate slots are currently filled." });
      }
    }

    const auth = createSupabaseAuthClient();
    const { data, error } = await auth.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          affiliate_role: payload.role,
          lead_code: payload.leadCode ?? null,
        },
        emailRedirectTo: authRedirect(`/verify-email?email=${encodeURIComponent(payload.email)}`),
      },
    });

    if (error) {
      const status = /already|registered|exists/i.test(error.message) ? 409 : 400;
      return res.status(status).json({ error: error.message });
    }

    const profile = await syncEmailProfile(
      payload.email,
      payload.fullName,
      data.user?.email_confirmed_at ?? null,
    );
    const account = await upsertAffiliateAccount({
      profileId: profile.id,
      role: payload.role,
      leadProfileId,
      phone: payload.phone,
    });

    if (data.session && account.status === "approved") {
      return res.status(201).json({
        token: signProfileToken(profile, payload.email),
        profile,
        account,
      });
    }

    return res.status(201).json({
      needsApproval: true,
      profile,
      account,
      message:
        account.status === "pending"
          ? "Your affiliate application is pending admin approval. You can sign in after approval."
          : "Check your email for the Supabase verification link, then sign in.",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const account = await requireAffiliate(profileId);
    const supabase = getSupabase();
    const [artworks, campaigns, clicks, commissions, team] = await Promise.all([
      supabase
        .from("artworks")
        .select("*, artists(*)")
        .in("status", ["listed", "owned"])
        .order("created_at", { ascending: false }),
      supabase
        .from("affiliate_campaigns")
        .select("*, artworks(*, artists(*))")
        .eq("affiliate_profile_id", profileId)
        .order("created_at", { ascending: false }),
      supabase.from("affiliate_clicks").select("id, campaign_id, artwork_id").eq("affiliate_profile_id", profileId),
      supabase
        .from("affiliate_commissions")
        .select("*, orders(*, artworks(title, image_url))")
        .eq("affiliate_profile_id", profileId)
        .order("created_at", { ascending: false }),
      supabase
        .from("affiliate_accounts")
        .select("profile_id, affiliate_code, role, status, profiles(display_name, wallet_address)")
        .eq("lead_profile_id", profileId)
        .order("joined_at", { ascending: false }),
    ]);

    if (artworks.error) throw artworks.error;
    if (campaigns.error) throw campaigns.error;
    if (clicks.error) throw clicks.error;
    if (commissions.error) throw commissions.error;
    if (team.error) throw team.error;

    const clickRows = (clicks.data ?? []) as Array<{ campaign_id?: string | null; artwork_id: string }>;
    const commissionRows = (commissions.data ?? []) as CommissionRow[];
    const campaignRows = (campaigns.data ?? []) as CampaignRow[];
    const clickCountByCampaign = new Map<string, number>();
    const clickCountByArtwork = new Map<string, number>();
    for (const click of clickRows) {
      if (click.campaign_id) {
        clickCountByCampaign.set(click.campaign_id, (clickCountByCampaign.get(click.campaign_id) ?? 0) + 1);
      }
      clickCountByArtwork.set(click.artwork_id, (clickCountByArtwork.get(click.artwork_id) ?? 0) + 1);
    }

    const commissionByArtwork = new Map<string, CommissionRow[]>();
    for (const commission of commissionRows) {
      const current = commissionByArtwork.get(commission.artwork_id) ?? [];
      current.push(commission);
      commissionByArtwork.set(commission.artwork_id, current);
    }

    const enrichedCampaigns = campaignRows.map((campaign) => {
      const artworkCommissions = commissionByArtwork.get(campaign.artwork_id) ?? [];
      return {
        ...campaign,
        clicks: clickCountByCampaign.get(campaign.id) ?? clickCountByArtwork.get(campaign.artwork_id) ?? 0,
        sales: artworkCommissions.filter((commission) => ["pending", "approved", "paid"].includes(commission.status))
          .length,
        earnings: artworkCommissions.reduce((sum, commission) => sum + Number(commission.amount ?? 0), 0),
      };
    });

    const pending = commissionRows.filter((commission) => commission.status === "pending");
    const approved = commissionRows.filter((commission) => commission.status === "approved");
    const paid = commissionRows.filter((commission) => commission.status === "paid");
    const stats = {
      clicks: clickRows.length,
      sales: commissionRows.filter((commission) => ["pending", "approved", "paid"].includes(commission.status)).length,
      pendingCommission: pending.reduce((sum, commission) => sum + Number(commission.amount ?? 0), 0),
      approvedCommission: approved.reduce((sum, commission) => sum + Number(commission.amount ?? 0), 0),
      paidCommission: paid.reduce((sum, commission) => sum + Number(commission.amount ?? 0), 0),
      totalRevenue: commissionRows.reduce(
        (sum, commission) => sum + Number(commission.orders?.amount ?? 0),
        0,
      ),
    };

    return res.json({
      account,
      profile: account.profiles,
      artworks: artworks.data ?? [],
      campaigns: enrichedCampaigns,
      commissions: commissionRows,
      team: team.data ?? [],
      stats,
      commissionRate: COMMISSION_RATE,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });
    const account = await requireAffiliate(profileId);
    if (account.status !== "approved") {
      return res.status(403).json({ error: "This affiliate account is not approved." });
    }
    const { artworkId } = campaignSchema.parse(req.body);
    const supabase = getSupabase();

    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("id, status")
      .eq("id", artworkId)
      .single();

    if (artworkError) throw artworkError;
    if (!["listed", "owned"].includes(String(artwork.status))) {
      return res.status(409).json({ error: "This artwork cannot be promoted." });
    }

    const { data, error } = await supabase
      .from("affiliate_campaigns")
      .upsert(
        {
          affiliate_profile_id: profileId,
          artwork_id: artworkId,
        },
        { onConflict: "affiliate_profile_id,artwork_id" },
      )
      .select("*, artworks(*, artists(*))")
      .single();

    if (error) throw error;
    return res.status(201).json({ campaign: data });
  } catch (error) {
    next(error);
  }
});

router.post("/clicks", async (req, res, next) => {
  try {
    const clientIp = req.ip ?? req.connection.remoteAddress ?? "unknown";
    if (!checkClickRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    const payload = clickSchema.parse(req.body);
    const supabase = getSupabase();
    const { data: account, error: accountError } = await supabase
      .from("affiliate_accounts")
      .select("*")
      .eq("affiliate_code", payload.affiliateCode)
      .eq("status", "approved")
      .maybeSingle();

    if (accountError) throw accountError;
    const affiliate = account as AffiliateAccountRow | null;
    if (!affiliate) return res.status(404).json({ error: "Affiliate code was not found." });

    const { data: campaign, error: campaignError } = await supabase
      .from("affiliate_campaigns")
      .upsert(
        {
          affiliate_profile_id: affiliate.profile_id,
          artwork_id: payload.artworkId,
        },
        { onConflict: "affiliate_profile_id,artwork_id" },
      )
      .select("id")
      .single();

    if (campaignError) throw campaignError;

    const { error } = await supabase.from("affiliate_clicks").insert({
      campaign_id: campaign.id,
      affiliate_profile_id: affiliate.profile_id,
      artwork_id: payload.artworkId,
      visitor_key: payload.visitorKey ?? null,
      user_agent: req.get("user-agent")?.slice(0, 300) ?? null,
    });

    if (error) throw error;
    return res.status(201).json({ recorded: true });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/approve/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required." });
    const { id } = req.params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("affiliate_accounts")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("profile_id", id)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ account: data });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/suspend/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required." });
    const { id } = req.params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("affiliate_accounts")
      .update({ status: "suspended", updated_at: new Date().toISOString() })
      .eq("profile_id", id)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ account: data });
  } catch (error) {
    next(error);
  }
});

router.post("/commissions/:id/approve", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required." });
    const { id } = req.params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("affiliate_commissions")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ commission: data });
  } catch (error) {
    next(error);
  }
});

router.post("/commissions/:id/pay", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required." });
    const { id } = req.params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("affiliate_commissions")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "approved")
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ commission: data });
  } catch (error) {
    next(error);
  }
});

export default router;
