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

const imageUploadSchema = z.object({
  fileName: z.string().min(1).max(180),
  contentType: z.string().min(1),
  data: z.string().min(1),
});

function sanitizeFileName(fileName: string) {
  const normalized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "artwork-image";
}

router.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "listed";
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("artworks")
      .select("*, artists(*)")
      .in("status", status === "market" ? ["listed", "owned"] : [status])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ artworks: data });
  } catch (error) {
    next(error);
  }
});

router.post("/upload-image", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = imageUploadSchema.parse(req.body);

    if (!payload.contentType.startsWith("image/")) {
      return res.status(400).json({ error: "Only image uploads are supported." });
    }

    const base64 = payload.data.includes(",") ? payload.data.split(",").pop() : payload.data;
    const buffer = Buffer.from(base64 ?? "", "base64");

    if (!buffer.length) {
      return res.status(400).json({ error: "The uploaded image could not be read." });
    }

    if (buffer.byteLength > 7 * 1024 * 1024) {
      return res.status(413).json({ error: "Images must be smaller than 7 MB." });
    }

    const safeName = sanitizeFileName(payload.fileName);
    const path = `artworks/${req.user?.sub}/${Date.now()}-${safeName}`;
    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from("collectibles")
      .upload(path, buffer, { contentType: payload.contentType, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("collectibles").getPublicUrl(path);

    return res.status(201).json({ path, imageUrl: data.publicUrl });
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
