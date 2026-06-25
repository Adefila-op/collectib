import { Router } from "express";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

const orderSchema = z.object({
  artworkId: z.string().uuid(),
  paymentProvider: z.enum(["wallet", "flutterwave", "moonpay"]),
  paymentReference: z.string().optional(),
});

const cryptoPaymentSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  txSignature: z.string().min(32).max(128),
});

type OrderArtworkRow = {
  seller_profile_id: string;
  price_amount: number | string;
  price_currency: string;
  status: string;
};

type CheckoutOrderRow = {
  buyer_profile_id: string;
  amount: number | string;
  currency: string;
  payment_reference: string;
};

type CryptoOrderRow = {
  buyer_profile_id: string;
  payment_provider: string;
};

router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("orders")
      .select("*, artworks(title, image_url)")
      .eq("buyer_profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ orders: data });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = orderSchema.parse(req.body);
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("seller_profile_id, price_amount, price_currency, status")
      .eq("id", payload.artworkId)
      .single();

    if (artworkError) throw artworkError;
    const listedArtwork = artwork as OrderArtworkRow;
    if (listedArtwork.status !== "listed") {
      return res.status(409).json({ error: "This artwork is no longer available." });
    }
    if (listedArtwork.seller_profile_id === profileId) {
      return res.status(409).json({ error: "You cannot buy your own listing." });
    }

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from("orders")
      .select("id")
      .eq("artwork_id", payload.artworkId)
      .in("status", ["pending", "payment_review", "crypto_submitted", "paid"])
      .maybeSingle();

    if (existingOrderError) throw existingOrderError;
    if (existingOrder) {
      return res.status(409).json({ error: "This artwork already has an active order." });
    }

    const paymentReference =
      payload.paymentReference ?? `COL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        artwork_id: payload.artworkId,
        buyer_profile_id: profileId,
        seller_profile_id: listedArtwork.seller_profile_id,
        amount: listedArtwork.price_amount,
        currency: listedArtwork.price_currency,
        payment_provider: payload.paymentProvider,
        payment_reference: paymentReference,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw error;

    await supabase
      .from("artworks")
      .update({ status: "reserved", updated_at: new Date().toISOString() })
      .eq("id", payload.artworkId);

    return res.status(201).json({ order: data });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/flutterwave", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const secretKey = requireEnv("flutterwaveSecretKey");
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_profile_id, amount, currency, payment_reference, artworks(title)")
      .eq("id", req.params.id)
      .single();

    if (orderError) throw orderError;
    const checkoutOrder = order as CheckoutOrderRow;
    if (checkoutOrder.buyer_profile_id !== profileId) {
      return res.status(403).json({ error: "You can only pay for your own order." });
    }

    const txRef = checkoutOrder.payment_reference;
    const redirectUrl =
      config.paymentRedirectUrl || `${req.protocol}://${req.get("host")}/checkout/success`;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        authorization: `Bearer ${secretKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: Number(checkoutOrder.amount),
        currency: checkoutOrder.currency,
        redirect_url: redirectUrl,
        customer: {
          email: `${profileId}@collectibles.local`,
          name: req.user?.walletAddress ?? "Collector",
        },
        customizations: {
          title: "Collectibles artwork purchase",
          description: "Artwork checkout",
        },
      }),
    });
    const body = await response.json();
    if (!response.ok || body.status !== "success") {
      return res.status(502).json({ error: "Flutterwave checkout failed.", details: body });
    }

    return res.json({
      paymentReference: txRef,
      checkoutUrl: body.data?.link,
      providerResponse: body.data,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/crypto-payment", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = cryptoPaymentSchema.parse(req.body);
    if (payload.walletAddress !== req.user?.walletAddress) {
      return res.status(403).json({ error: "Payment wallet must match the connected wallet." });
    }

    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_profile_id, payment_provider")
      .eq("id", req.params.id)
      .single();

    if (orderError) throw orderError;
    const cryptoOrder = order as CryptoOrderRow;
    if (cryptoOrder.buyer_profile_id !== profileId) {
      return res.status(403).json({ error: "You can only pay for your own order." });
    }
    if (cryptoOrder.payment_provider !== "wallet") {
      return res.status(409).json({ error: "This order is not configured for wallet payment." });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "crypto_submitted",
        settlement_signature: payload.txSignature,
        payment_payload: {
          walletAddress: payload.walletAddress,
          txSignature: payload.txSignature,
          submittedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;
    return res.json({ order: data });
  } catch (error) {
    next(error);
  }
});

export default router;
