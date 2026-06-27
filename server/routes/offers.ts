import { Router } from "express";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import { recalculateArtworkMarketValue } from "../services/market-value.js";
import { issueProvenanceCertificate } from "../services/provenance.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

const offerSchema = z.object({
  artworkId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "USDC", "SOL"]).default("USD"),
  message: z.string().max(500).optional(),
  paymentProvider: z.enum(["wallet", "flutterwave"]),
});

const walletPaymentSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  txSignature: z.string().min(32).max(128),
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
  amount: number | string;
  currency: string;
  payment_reference: string;
};

type FlutterwavePaymentResponse = {
  status?: string;
  data?: {
    link?: string;
  } & Record<string, unknown>;
};

function offerRedirectUrl() {
  return `${config.publicAppUrl}/offers`;
}

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
    if (!["listed", "owned"].includes(targetArtwork.status)) {
      return res.status(409).json({ error: "This artwork is not accepting offers." });
    }
    if (targetArtwork.seller_profile_id === req.user?.sub) {
      return res.status(409).json({ error: "You cannot make an offer on your own listing." });
    }

    const paymentReference = `OFFER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabase
      .from("offers")
      .insert({
        artwork_id: payload.artworkId,
        buyer_profile_id: req.user?.sub,
        seller_profile_id: targetArtwork.seller_profile_id,
        amount: payload.amount,
        currency: payload.currency,
        message: payload.message,
        payment_provider: payload.paymentProvider,
        payment_reference: paymentReference,
        status: "pending_payment",
      })
      .select("*")
      .single();

    if (error) throw error;
    const createdOffer = data as CreatedOfferRow;

    if (payload.paymentProvider === "flutterwave") {
      const secretKey = requireEnv("flutterwaveSecretKey");
      const redirectUrl = offerRedirectUrl();
      const response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          authorization: `Bearer ${secretKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: createdOffer.payment_reference,
          amount: Number(createdOffer.amount),
          currency: createdOffer.currency,
          redirect_url: redirectUrl,
          customer: {
            email: req.user?.email ?? `${req.user?.sub}@collectibles.local`,
            name: req.user?.walletAddress ?? "Collector",
          },
          customizations: {
            title: "Collectibles artwork offer",
            description: "Offer payment",
          },
        }),
      });
      const body = (await response.json()) as FlutterwavePaymentResponse;
      if (!response.ok || body.status !== "success") {
        return res.status(502).json({ error: "Flutterwave checkout failed.", details: body });
      }

      return res.status(201).json({
        offer: data,
        paymentReference: createdOffer.payment_reference,
        checkoutUrl: body.data?.link,
      });
    }

    return res.status(201).json({ offer: data, paymentReference: createdOffer.payment_reference });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/wallet-payment", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = walletPaymentSchema.parse(req.body);
    if (payload.walletAddress !== req.user?.walletAddress) {
      return res.status(403).json({ error: "Payment wallet must match the connected wallet." });
    }

    const supabase = getSupabase();
    const { data: existing, error: existingError } = await supabase
      .from("offers")
      .select("id, artwork_id, buyer_profile_id, seller_profile_id, status, payment_provider")
      .eq("id", req.params.id)
      .single();

    if (existingError) throw existingError;
    const existingOffer = existing as OfferTransitionRow & { payment_provider?: string };
    if (existingOffer.buyer_profile_id !== req.user?.sub) {
      return res.status(403).json({ error: "You can only pay for your own offer." });
    }
    if (existingOffer.payment_provider !== "wallet") {
      return res.status(409).json({ error: "This offer is not configured for wallet payment." });
    }
    if (existingOffer.status !== "pending_payment" && existingOffer.status !== "payment_review") {
      return res.status(409).json({ error: "This offer is not awaiting payment." });
    }

    const { data, error } = await supabase
      .from("offers")
      .update({
        status: "active",
        offeror_wallet: payload.walletAddress,
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
    await recalculateArtworkMarketValue(existingOffer.artwork_id, "offer_created", existingOffer.id);

    return res.json({ offer: data });
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
      await issueProvenanceCertificate({
        artworkId: existingOffer.artwork_id,
        holderProfileId: existingOffer.buyer_profile_id,
        source: "offer_accepted",
        sourceId: existingOffer.id,
      });
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
