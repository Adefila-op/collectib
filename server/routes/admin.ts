import { Router } from "express";
import { config } from "../config.js";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import {
  getHomePromoBanner,
  promoBannerSchema,
  updateHomePromoBanner,
} from "../services/promo-banner.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

router.use(requireAuth, (req: AuthedRequest, res, next) => {
  if (req.user?.email !== "admin@admin.com") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
});

router.get("/summary", async (_req, res, next) => {
  try {
    const supabase = getSupabase();
    const [
      artworks,
      listedArtworks,
      orders,
      paidOrders,
      activeOffers,
      webhookEvents,
      recentOrders,
      recentWebhooks,
    ] = await Promise.all([
      supabase.from("artworks").select("id", { count: "exact", head: true }),
      supabase.from("artworks").select("id", { count: "exact", head: true }).eq("status", "listed"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("amount", { count: "exact" }).eq("status", "paid"),
      supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("webhook_events").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id, amount, currency, status, payment_provider, created_at, artworks(title)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("webhook_events")
        .select("id, provider, event_type, external_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const revenue = (paidOrders.data ?? []).reduce(
      (sum, order) => sum + Number(order.amount ?? 0),
      0,
    );

    return res.json({
      stats: {
        artworks: artworks.count ?? 0,
        listedArtworks: listedArtworks.count ?? 0,
        orders: orders.count ?? 0,
        paidOrders: paidOrders.count ?? 0,
        activeOffers: activeOffers.count ?? 0,
        webhookEvents: webhookEvents.count ?? 0,
        revenue,
      },
      recentOrders: recentOrders.data ?? [],
      recentWebhooks: recentWebhooks.data ?? [],
    });
  } catch (error) {
    next(error);
  }
});

router.get("/promo-banner", async (_req, res, next) => {
  try {
    const banner = await getHomePromoBanner();
    return res.json({ banner });
  } catch (error) {
    next(error);
  }
});

router.patch("/promo-banner", async (req, res, next) => {
  try {
    const payload = promoBannerSchema.parse(req.body);
    const banner = await updateHomePromoBanner(payload);
    return res.json({ banner });
  } catch (error) {
    next(error);
  }
});

router.get("/data/:table", async (req, res, next) => {
  try {
    const table = req.params.table;
    const allowedTables = [
      "profiles",
      "artists",
      "artworks",
      "offers",
      "orders",
      "affiliate_accounts",
      "affiliate_campaigns",
    ];
    if (!allowedTables.includes(table)) return res.status(400).json({ error: "Invalid table" });

    const supabase = getSupabase();
    // For profiles, also pull the linked email
    const selectStr = table === "profiles"
      ? "*, email_accounts(email)"
      : "*";
    // Use an appropriate default sort
    const { data: rawData, error } = await supabase
      .from(table)
      .select(selectStr)
      .order(table === "affiliate_accounts" ? "joined_at" : "created_at", { ascending: false });

    if (error) throw error;

    // Flatten email from nested email_accounts
    const data = table === "profiles"
      ? (rawData ?? []).map((row: any) => {
          const email = row.email_accounts?.[0]?.email ?? null;
          const { email_accounts: _, ...rest } = row;
          return { ...rest, email };
        })
      : rawData;

    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch("/data/:table/:id", async (req, res, next) => {
  try {
    const table = req.params.table;
    const id = req.params.id;
    const allowedTables = [
      "profiles",
      "artists",
      "artworks",
      "offers",
      "orders",
      "affiliate_accounts",
      "affiliate_campaigns",
    ];
    if (!allowedTables.includes(table)) return res.status(400).json({ error: "Invalid table" });

    const payload = { ...req.body };
    // Strip system / read-only / joined fields
    for (const f of ["id", "created_at", "updated_at", "joined_at", "email", "asking_price", "email_accounts"]) {
      delete payload[f];
    }

    const supabase = getSupabase();
    const pk = table === "affiliate_accounts" ? "profile_id" : "id";

    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq(pk, id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.delete("/data/:table/:id", async (req, res, next) => {
  try {
    const table = req.params.table;
    const id = req.params.id;

    const allowedTables = [
      "profiles",
      "artists",
      "artworks",
      "offers",
      "orders",
      "affiliate_accounts",
      "affiliate_campaigns",
    ];
    if (!allowedTables.includes(table))
      return res.status(400).json({ error: "Invalid table" });

    const supabase = getSupabase();
    const pk = table === "affiliate_accounts" ? "profile_id" : "id";

    // Manual cascade deletion to avoid FK constraint errors
    if (table === "profiles") {
      // Artists
      const { data: artists } = await supabase.from("artists").select("id").eq("profile_id", id);
      if (artists && artists.length > 0) {
        const artistIds = artists.map((a: any) => a.id);
        await supabase.from("artworks").delete().in("artist_id", artistIds);
        await supabase.from("artists").delete().eq("profile_id", id);
      }
      // Other profile-linked tables
      await Promise.all([
        supabase.from("artworks").delete().eq("seller_profile_id", id),
        supabase.from("offers").delete().eq("buyer_profile_id", id),
        supabase.from("orders").delete().eq("buyer_profile_id", id),
        supabase.from("affiliate_accounts").delete().eq("profile_id", id),
        supabase.from("affiliate_campaigns").delete().eq("profile_id", id),
        supabase.from("email_accounts").delete().eq("profile_id", id),
        supabase.from("connected_wallets").delete().eq("profile_id", id),
      ]);
    } else if (table === "artists") {
      await supabase.from("artworks").delete().eq("artist_id", id);
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq(pk, id);

    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
