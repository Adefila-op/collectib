import { Router } from "express";
import { z } from "zod";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import { recalculateArtworkMarketValue } from "../services/market-value.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

const offerSchema = z.object({
  artworkId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "USDC", "SOL"]).default("USD"),
  message: z.string().max(500).optional(),
});

type ArtworkOfferTarget = {
  seller_profile_id: string;
  status: string;
};

type OfferTransitionRow = {
  id: string;
  artwork_id: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  status: string;
};

type CreatedOfferRow = {
  id: string;
};

router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("offers")
      .select("*, artworks(title, image_url, seller_profile_id)")
      .or(`buyer_profile_id.eq.${req.user?.sub},seller_profile_id.eq.${req.user?.sub}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ offers: data });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = offerSchema.parse(req.body);
    const supabase = getSupabase();

    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("seller_profile_id, status")
      .eq("id", payload.artworkId)
      .single();

    if (artworkError) throw artworkError;
    const targetArtwork = artwork as ArtworkOfferTarget;
    if (targetArtwork.status !== "listed") {
      return res.status(409).json({ error: "This artwork is not accepting offers." });
    }
    if (targetArtwork.seller_profile_id === req.user?.sub) {
      return res.status(409).json({ error: "You cannot make an offer on your own listing." });
    }

    const { data, error } = await supabase
      .from("offers")
      .insert({
        artwork_id: payload.artworkId,
        buyer_profile_id: req.user?.sub,
        seller_profile_id: targetArtwork.seller_profile_id,
        amount: payload.amount,
        currency: payload.currency,
        message: payload.message,
        status: "active",
      })
      .select("*")
      .single();

    if (error) throw error;
    const createdOffer = data as CreatedOfferRow;
    await recalculateArtworkMarketValue(payload.artworkId, "offer_created", createdOffer.id);

    return res.status(201).json({ offer: data });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(["accepted", "rejected", "withdrawn"]) })
      .parse(req.body);
    const supabase = getSupabase();
    const { data: existing, error: existingError } = await supabase
      .from("offers")
      .select("id, artwork_id, buyer_profile_id, seller_profile_id, status")
      .eq("id", req.params.id)
      .single();

    if (existingError) throw existingError;
    const existingOffer = existing as OfferTransitionRow;
    if (existingOffer.status !== "active") {
      return res.status(409).json({ error: "Only active offers can be updated." });
    }
    if (status === "accepted" || status === "rejected") {
      if (existingOffer.seller_profile_id !== req.user?.sub) {
        return res.status(403).json({ error: "Only the seller can accept or reject an offer." });
      }
    }
    if (status === "withdrawn" && existingOffer.buyer_profile_id !== req.user?.sub) {
      return res.status(403).json({ error: "Only the buyer can withdraw an offer." });
    }

    const { data, error } = await supabase
      .from("offers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;
    if (status === "accepted") {
      await supabase
        .from("artworks")
        .update({ status: "reserved", updated_at: new Date().toISOString() })
        .eq("id", existingOffer.artwork_id);
    }
    await recalculateArtworkMarketValue(
      existingOffer.artwork_id,
      status === "accepted"
        ? "offer_accepted"
        : status === "rejected"
          ? "offer_rejected"
          : "offer_withdrawn",
      existingOffer.id,
    );

    return res.json({ offer: data });
  } catch (error) {
    next(error);
  }
});

export default router;
