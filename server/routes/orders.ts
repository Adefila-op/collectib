import { Router } from "express";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import { issueProvenanceCertificate } from "../services/provenance.js";
import { attachAffiliateToOrder, markAffiliateOrderPaid } from "./affiliates.js";
import type { AuthedRequest } from "../types.js";

const router = Router();
const ORDER_RESERVATION_TTL_MS = 30 * 60 * 1000;
const ORDER_RESERVATION_STATUSES = ["pending", "payment_review", "crypto_submitted"] as const;
const ORDER_BLOCKING_STATUSES = [...ORDER_RESERVATION_STATUSES, "paid"] as const;

const orderSchema = z.object({
  artworkId: z.string().uuid(),
  paymentProvider: z.enum(["wallet", "flutterwave"]),
  paymentReference: z.string().optional(),
  affiliateCode: z.string().trim().max(32).optional(),
});

const cryptoPaymentSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  txSignature: z.string().min(32).max(128),
});

const verifyFlutterwaveSchema = z.object({
  txRef: z.string().trim().min(6).max(120),
  transactionId: z.string().trim().min(1).max(80).optional(),
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

type ActiveOrderRow = {
  id: string;
  artwork_id: string;
  status: string;
  created_at?: string | null;
  expires_at?: string | null;
};

type FlutterwavePaymentResponse = {
  status?: string;
  message?: string;
  data?: {
    link?: string;
  } & Record<string, unknown>;
};

type FlutterwaveVerificationResponse = {
  status?: string;
  message?: string;
  data?: {
    status?: string;
    tx_ref?: string;
    amount?: number | string;
    currency?: string;
  } & Record<string, unknown>;
};

function paymentSuccessUrl(txRef: string) {
  const base = config.paymentRedirectUrl || `${config.publicAppUrl}/checkout/success`;
  const url = new URL(base);
  url.searchParams.set("tx_ref", txRef);
  return url.toString();
}

function orderExpiresAt() {
  return new Date(Date.now() + ORDER_RESERVATION_TTL_MS).toISOString();
}

function isOrderExpired(order: ActiveOrderRow, now = Date.now()) {
  const expiresAt = order.expires_at ? new Date(order.expires_at).getTime() : Number.NaN;
  if (Number.isFinite(expiresAt)) return expiresAt <= now;
  const createdAt = order.created_at ? new Date(order.created_at).getTime() : Number.NaN;
  return Number.isFinite(createdAt) && createdAt + ORDER_RESERVATION_TTL_MS <= now;
}

async function releaseArtworkIfUnblocked(
  supabase: ReturnType<typeof getSupabase>,
  artworkId: string,
) {
  const { data: remaining, error } = await supabase
    .from("orders")
    .select("id")
    .eq("artwork_id", artworkId)
    .in("status", [...ORDER_BLOCKING_STATUSES])
    .limit(1);

  if (error) throw error;
  if (remaining?.length) return;

  const { error: artworkError } = await supabase
    .from("artworks")
    .update({ status: "listed", updated_at: new Date().toISOString() })
    .eq("id", artworkId)
    .eq("status", "reserved");

  if (artworkError) throw artworkError;
}

async function expireOrder(
  supabase: ReturnType<typeof getSupabase>,
  order: ActiveOrderRow,
) {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "failed",
      payment_payload: {
        reason: "reservation_expired",
        expiredAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .in("status", [...ORDER_RESERVATION_STATUSES]);

  if (error) throw error;
  await releaseArtworkIfUnblocked(supabase, order.artwork_id);
}

async function releaseStaleOrdersForArtwork(
  supabase: ReturnType<typeof getSupabase>,
  artworkId: string,
) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, artwork_id, status, created_at, expires_at")
    .eq("artwork_id", artworkId)
    .in("status", [...ORDER_RESERVATION_STATUSES]);

  if (error) throw error;

  const staleOrders = ((data ?? []) as ActiveOrderRow[]).filter((order) => isOrderExpired(order));
  for (const order of staleOrders) {
    await expireOrder(supabase, order);
  }

  return staleOrders.length;
}

export async function releaseStaleOrderReservations() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("id, artwork_id, status, created_at, expires_at")
    .in("status", [...ORDER_RESERVATION_STATUSES]);

  if (error) throw error;

  const staleOrders = ((data ?? []) as ActiveOrderRow[]).filter((order) => isOrderExpired(order));
  for (const order of staleOrders) {
    await expireOrder(supabase, order);
  }

  return { released: staleOrders.length };
}

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
    const { error: artworkError } = await supabase
      .from("artworks")
      .select("seller_profile_id, price_amount, price_currency, status")
      .eq("id", payload.artworkId)
      .single();

    if (artworkError) throw artworkError;
    await releaseStaleOrdersForArtwork(supabase, payload.artworkId);

    const { data: refreshedArtwork, error: refreshedArtworkError } = await supabase
      .from("artworks")
      .select("seller_profile_id, price_amount, price_currency, status")
      .eq("id", payload.artworkId)
      .single();

    if (refreshedArtworkError) throw refreshedArtworkError;
    const listedArtwork = refreshedArtwork as OrderArtworkRow;
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
      .in("status", [...ORDER_BLOCKING_STATUSES])
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
        expires_at: orderExpiresAt(),
      })
      .select("*")
      .single();

    if (error) throw error;

    await supabase
      .from("artworks")
      .update({ status: "reserved", updated_at: new Date().toISOString() })
      .eq("id", payload.artworkId);

    const createdOrder = data as { id: string };
    if (payload.affiliateCode) {
      await attachAffiliateToOrder({
        id: createdOrder.id,
        artwork_id: payload.artworkId,
        buyer_profile_id: profileId,
        seller_profile_id: listedArtwork.seller_profile_id,
        amount: listedArtwork.price_amount,
        currency: listedArtwork.price_currency,
        affiliateCode: payload.affiliateCode,
      });
    }

    return res.status(201).json({ order: data });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/cancel", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, artwork_id, buyer_profile_id, status")
      .eq("id", req.params.id)
      .single();

    if (orderError) throw orderError;
    const cancellableOrder = order as ActiveOrderRow & { buyer_profile_id: string };
    if (cancellableOrder.buyer_profile_id !== profileId) {
      return res.status(403).json({ error: "You can only cancel your own order." });
    }
    if (!ORDER_RESERVATION_STATUSES.includes(cancellableOrder.status as (typeof ORDER_RESERVATION_STATUSES)[number])) {
      return res.status(409).json({ error: "This order can no longer be cancelled." });
    }

    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_payload: {
          reason: "buyer_cancelled",
          cancelledAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", cancellableOrder.id)
      .select("*")
      .single();

    if (error) throw error;
    await releaseArtworkIfUnblocked(supabase, cancellableOrder.artwork_id);
    return res.json({ order: updated });
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
    const redirectUrl = paymentSuccessUrl(txRef);
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
          email: req.user?.email ?? `${profileId}@collectibles.local`,
          name: req.user?.walletAddress ?? "Collector",
        },
        customizations: {
          title: "Collectibles artwork purchase",
          description: "Artwork checkout",
        },
      }),
    });
    const body = (await response.json()) as FlutterwavePaymentResponse;
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

router.post("/flutterwave/verify", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const secretKey = requireEnv("flutterwaveSecretKey");
    const payload = verifyFlutterwaveSchema.parse(req.body);
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, artwork_id, buyer_profile_id, amount, currency, payment_reference")
      .eq("payment_reference", payload.txRef)
      .single();

    if (orderError) throw orderError;
    const checkoutOrder = order as CheckoutOrderRow & { id: string; artwork_id: string };
    if (checkoutOrder.buyer_profile_id !== profileId) {
      return res.status(403).json({ error: "You can only verify your own order." });
    }

    if (!payload.transactionId) {
      return res.json({ verified: false, status: "pending", order });
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(payload.transactionId)}/verify`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${secretKey}`,
        },
      },
    );
    const body = (await response.json()) as FlutterwaveVerificationResponse;
    if (!response.ok || body.status !== "success") {
      return res.status(502).json({ error: body.message || "Flutterwave verification failed." });
    }

    const payment = body.data;
    const paymentMatches =
      payment?.status === "successful" &&
      payment.tx_ref === checkoutOrder.payment_reference &&
      Number(payment.amount ?? 0) === Number(checkoutOrder.amount) &&
      (!payment.currency || payment.currency === checkoutOrder.currency);

    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        status: paymentMatches ? "paid" : "payment_review",
        payment_payload: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutOrder.id)
      .select("*")
      .single();

    if (error) throw error;

    if (paymentMatches) {
      await supabase
        .from("artworks")
        .update({ status: "sold", updated_at: new Date().toISOString() })
        .eq("id", checkoutOrder.artwork_id);
      await markAffiliateOrderPaid(checkoutOrder.id);
      await issueProvenanceCertificate({
        artworkId: checkoutOrder.artwork_id,
        holderProfileId: profileId,
        source: "order_paid",
        sourceId: checkoutOrder.id,
      });
    }

    return res.json({ verified: paymentMatches, order: updated, providerResponse: payment });
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
