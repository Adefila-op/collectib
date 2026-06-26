import { Router } from "express";
import { requireEnv } from "../config.js";
import { getSupabase } from "../db.js";
import { recalculateArtworkMarketValue } from "../services/market-value.js";

const router = Router();

type PaymentOrderRow = {
  id: string;
  artwork_id: string;
  amount: number | string;
  currency: string;
};

type PaymentOfferRow = {
  id: string;
  artwork_id: string;
  amount: number | string;
  currency: string;
};

router.post("/helius", async (req, res, next) => {
  try {
    const secret = requireEnv("heliusWebhookSecret");
    const received = req.header("x-webhook-secret") ?? req.query.secret;
    if (received !== secret) {
      return res.status(401).json({ error: "Invalid Helius webhook secret." });
    }

    const events = Array.isArray(req.body) ? req.body : [req.body];
    const supabase = getSupabase();

    const { error } = await supabase.from("webhook_events").insert({
      provider: "helius",
      event_type: "solana_event_batch",
      payload: events,
    });

    if (error) throw error;

    for (const event of events) {
      const signature = event.signature ?? event.transactionSignature;
      if (!signature) continue;

      await supabase.from("chain_events").upsert(
        {
          signature,
          event_type: event.type ?? "unknown",
          payload: event,
        },
        { onConflict: "signature" },
      );
    }

    return res.json({ received: true, count: events.length });
  } catch (error) {
    next(error);
  }
});

router.post("/flutterwave", async (req, res, next) => {
  try {
    const secretHash = requireEnv("flutterwaveSecretHash");
    if (req.header("verif-hash") !== secretHash) {
      return res.status(401).json({ error: "Invalid Flutterwave verification hash." });
    }

    const supabase = getSupabase();
    const eventType = req.body?.event ?? req.body?.type ?? "flutterwave_event";
    const reference = req.body?.data?.tx_ref ?? req.body?.data?.reference ?? req.body?.tx_ref;

    const { error } = await supabase.from("webhook_events").insert({
      provider: "flutterwave",
      event_type: eventType,
      external_id: reference,
      payload: req.body,
    });

    if (error) throw error;

    if (reference) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, artwork_id, amount, currency")
        .eq("payment_reference", reference)
        .maybeSingle();
      const paymentOrder = order as PaymentOrderRow | null;
      const paidAmount = Number(req.body?.data?.amount ?? 0);
      const paidCurrency = req.body?.data?.currency;
      const expectedAmount = Number(paymentOrder?.amount ?? 0);
      const paymentMatches =
        paymentOrder &&
        paidAmount === expectedAmount &&
        (!paidCurrency || paidCurrency === paymentOrder.currency) &&
        req.body?.data?.status === "successful";

      await supabase
        .from("orders")
        .update({
          status: paymentMatches ? "paid" : "payment_review",
          payment_payload: req.body,
        })
        .eq("payment_reference", reference);

      if (paymentMatches) {
        await supabase
          .from("artworks")
          .update({ status: "sold", updated_at: new Date().toISOString() })
          .eq("id", paymentOrder.artwork_id);
      }

      if (!paymentOrder) {
        const { data: offer } = await supabase
          .from("offers")
          .select("id, artwork_id, amount, currency")
          .eq("payment_reference", reference)
          .maybeSingle();
        const paymentOffer = offer as PaymentOfferRow | null;
        const expectedOfferAmount = Number(paymentOffer?.amount ?? 0);
        const offerPaymentMatches =
          paymentOffer &&
          paidAmount === expectedOfferAmount &&
          (!paidCurrency || paidCurrency === paymentOffer.currency) &&
          req.body?.data?.status === "successful";

        await supabase
          .from("offers")
          .update({
            status: offerPaymentMatches ? "active" : "payment_review",
            payment_payload: req.body,
            updated_at: new Date().toISOString(),
          })
          .eq("payment_reference", reference);

        if (offerPaymentMatches) {
          await recalculateArtworkMarketValue(paymentOffer.artwork_id, "offer_created", paymentOffer.id);
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
