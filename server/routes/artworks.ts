import { Router } from "express";
import { z } from "zod";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

const artworkSchema = z.object({
  title: z.string().min(1),
  artistId: z.string().uuid().optional(),
  description: z.string().optional(),
  priceAmount: z.number().positive(),
  priceCurrency: z.enum(["USD", "USDC", "SOL"]).default("USD"),
  tokenMint: z.string().min(32).max(64).optional(),
  metadataUri: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "listed";
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("artworks")
      .select("*, artists(*)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ artworks: data });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("artworks")
      .select("*, artists(*)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;

    return res.json({ artwork: data });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = artworkSchema.parse(req.body);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("artworks")
      .insert({
        seller_profile_id: req.user?.sub,
        artist_id: payload.artistId,
        title: payload.title,
        description: payload.description,
        price_amount: payload.priceAmount,
        price_currency: payload.priceCurrency,
        token_mint: payload.tokenMint,
        metadata_uri: payload.metadataUri,
        image_url: payload.imageUrl,
        status: "listed",
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({ artwork: data });
  } catch (error) {
    next(error);
  }
});

export default router;
