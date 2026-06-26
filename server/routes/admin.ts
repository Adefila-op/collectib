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
  if (!req.user?.walletAddress || !config.adminWallets.includes(req.user.walletAddress)) {
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

export default router;
