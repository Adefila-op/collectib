import { Router } from "express";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

type ProfileRow = {
  id: string;
  wallet_address: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

type EmailAccountRow = {
  email?: string | null;
};

type ArtistRow = {
  id: string;
};

type CountResult = {
  count: number | null;
};

type ActivityArtwork = {
  title?: string | null;
  image_url?: string | null;
} | null;

type ActivityOfferRow = {
  id: string;
  amount?: number | string;
  currency?: string;
  status: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  created_at?: string;
  artworks?: ActivityArtwork;
};

type ActivityOrderRow = {
  id: string;
  amount?: number | string;
  currency?: string;
  status: string;
  payment_provider?: string;
  created_at?: string;
  artworks?: ActivityArtwork;
};

type PortfolioArtworkRow = {
  id: string;
  title: string;
  price_amount?: number | string;
  price_currency?: string;
  image_url?: string | null;
  status: string;
  artists?: { name?: string | null } | null;
};

type PortfolioOrderRow = {
  id: string;
  amount?: number | string;
  currency?: string;
  status: string;
  created_at?: string;
  artworks?: PortfolioArtworkRow | null;
};

function formatMoney(amount: number | string | undefined, currency: string | undefined) {
  if (amount === undefined || currency === undefined) return "";
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  const rendered = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "USDC" || currency === "SOL" ? "USD" : currency,
    maximumFractionDigits: currency === "USD" ? 2 : 6,
  }).format(value);
  return currency === "USD" ? rendered : `${rendered} ${currency}`;
}

function relativeTime(dateValue: string | undefined) {
  if (!dateValue) return "";
  const date = new Date(dateValue).getTime();
  if (!Number.isFinite(date)) return "";
  const diff = Date.now() - date;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const [profile, emailAccount, artist, saved, offers, orders] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, wallet_address, display_name, avatar_url, created_at")
        .eq("id", profileId)
        .single(),
      supabase.from("email_accounts").select("email").eq("profile_id", profileId).maybeSingle(),
      supabase.from("artists").select("id").eq("profile_id", profileId).maybeSingle(),
      supabase
        .from("connected_wallets")
        .select("wallet_address", { count: "exact", head: true })
        .eq("profile_id", profileId),
      supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .or(`buyer_profile_id.eq.${profileId},seller_profile_id.eq.${profileId}`),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_profile_id", profileId),
    ]);

    if (profile.error) throw profile.error;
    if (emailAccount.error) throw emailAccount.error;
    if (artist.error) throw artist.error;
    if (saved.error) throw saved.error;
    if (offers.error) throw offers.error;
    if (orders.error) throw orders.error;

    const profileRow = profile.data as ProfileRow;
    const emailRow = emailAccount.data as EmailAccountRow | null;
    const artistRow = artist.data as ArtistRow | null;

    return res.json({
      profile: {
        ...profileRow,
        email: req.user?.email ?? emailRow?.email ?? null,
        artist_id: artistRow?.id ?? null,
        stats: {
          connectedWallets: (saved as CountResult).count ?? 0,
          offers: (offers as CountResult).count ?? 0,
          orders: (orders as CountResult).count ?? 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/activity", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const [offers, orders] = await Promise.all([
      supabase
        .from("offers")
        .select("id, amount, currency, status, buyer_profile_id, seller_profile_id, created_at, updated_at, artworks(title, image_url)")
        .or(`buyer_profile_id.eq.${profileId},seller_profile_id.eq.${profileId}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("orders")
        .select("id, amount, currency, status, payment_provider, created_at, updated_at, artworks(title, image_url)")
        .eq("buyer_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (offers.error) throw offers.error;
    if (orders.error) throw orders.error;

    const offerRows = (offers.data ?? []) as ActivityOfferRow[];
    const orderRows = (orders.data ?? []) as ActivityOrderRow[];

    const offerItems = offerRows.map((offer) => {
      const isReceived = offer.seller_profile_id === profileId;
      return {
        id: `offer:${offer.id}`,
        type: "offer",
        title: isReceived ? "Offer received" : "Offer sent",
        subject: offer.artworks?.title ?? "Artwork",
        value: formatMoney(offer.amount, offer.currency),
        status: offer.status,
        imageUrl: offer.artworks?.image_url ?? null,
        createdAt: offer.created_at,
        time: relativeTime(offer.created_at),
      };
    });

    const orderItems = orderRows.map((order) => ({
      id: `order:${order.id}`,
      type: "order",
      title: "Order updated",
      subject: order.artworks?.title ?? "Artwork",
      value: `${formatMoney(order.amount, order.currency)} / ${String(order.status).replace(/_/g, " ")}`,
      status: order.status,
      imageUrl: order.artworks?.image_url ?? null,
      createdAt: order.created_at,
      time: relativeTime(order.created_at),
    }));

    const activities = [...offerItems, ...orderItems]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 30);

    return res.json({ activities });
  } catch (error) {
    next(error);
  }
});

router.get("/portfolio", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const [orders, listings] = await Promise.all([
      supabase
        .from("orders")
        .select("id, amount, currency, status, created_at, artworks(id, title, price_amount, price_currency, image_url, status, artists(name))")
        .eq("buyer_profile_id", profileId)
        .order("created_at", { ascending: false }),
      supabase
        .from("artworks")
        .select("id, title, price_amount, price_currency, image_url, status, artists(name)")
        .eq("seller_profile_id", profileId)
        .order("created_at", { ascending: false }),
    ]);

    if (orders.error) throw orders.error;
    if (listings.error) throw listings.error;

    const orderRows = (orders.data ?? []) as PortfolioOrderRow[];
    const listingRows = (listings.data ?? []) as PortfolioArtworkRow[];
    const paidOrders = orderRows.filter((order) =>
      ["paid", "crypto_submitted", "payment_review"].includes(order.status),
    );
    const purchasedArtworks = paidOrders
      .map((order) => order.artworks)
      .filter(Boolean) as PortfolioArtworkRow[];
    const artworkById = new Map<string, PortfolioArtworkRow>();

    [...purchasedArtworks, ...listingRows].forEach((artwork) => {
      artworkById.set(artwork.id, artwork);
    });

    const totalSpent = paidOrders.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
    const portfolioValue = Array.from(artworkById.values()).reduce(
      (sum, artwork) => sum + Number(artwork.price_amount ?? 0),
      0,
    );

    return res.json({
      stats: {
        portfolioValue,
        totalArtworks: artworkById.size,
        totalSpent,
        totalReturn: portfolioValue - totalSpent,
      },
      artworks: Array.from(artworkById.values()),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
