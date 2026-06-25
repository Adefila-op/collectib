import { getSupabase } from "../db.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HALF_LIFE_DAYS = 30;
const EXPIRED_FADE_DAYS = 7;
const LAST_SALE_WEIGHT = 0.4;
const HIGHEST_OFFER_WEIGHT = 0.35;
const AVERAGE_OFFER_WEIGHT = 0.25;
const REJECTED_SIGNAL_WEIGHT = 0.7;
const LOWBALL_FLOOR_RATIO = 0.2;

type ArtworkRow = {
  id: string;
  price_amount: number | string;
  price_currency: string;
};

type OfferRow = {
  id: string;
  amount: number | string;
  status: "active" | "accepted" | "rejected" | "expired" | "withdrawn" | string;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
};

type SaleRow = {
  sale_price: number | string;
  created_at: string;
};

type MarketRow = {
  market_value?: number | string | null;
  last_sale_price?: number | string | null;
};

export type MarketRecalcReason =
  | "offer_created"
  | "offer_updated"
  | "offer_accepted"
  | "offer_rejected"
  | "offer_expired"
  | "offer_withdrawn"
  | "market_recalc"
  | "sale";

type WeightedSignal = {
  amount: number;
  weight: number;
  offerId?: string;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function timeDecay(date: string | undefined, now = Date.now()) {
  if (!date) return 1;
  const ageDays = Math.max(0, (now - new Date(date).getTime()) / DAY_MS);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

function expiredFadeMultiplier(expiresAt: string | undefined, now = Date.now()) {
  if (!expiresAt) return 0;
  const expiredDays = Math.max(0, (now - new Date(expiresAt).getTime()) / DAY_MS);
  return Math.max(0, 1 - expiredDays / EXPIRED_FADE_DAYS);
}

function weightedAverage(signals: WeightedSignal[]) {
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  if (totalWeight <= 0) return 0;

  const total = signals.reduce((sum, signal) => sum + signal.amount * signal.weight, 0);
  return total / totalWeight;
}

function signalForOffer(
  offer: OfferRow,
  lowballFloor: number,
  now = Date.now(),
): WeightedSignal | null {
  const amount = toNumber(offer.amount);
  if (amount <= 0 || amount < lowballFloor) return null;

  if (offer.status === "withdrawn") return null;

  if (offer.status === "active" || offer.status === "accepted") {
    return {
      amount,
      weight: timeDecay(offer.created_at, now),
      offerId: offer.id,
    };
  }

  if (offer.status === "rejected") {
    return {
      amount,
      weight: REJECTED_SIGNAL_WEIGHT * timeDecay(offer.updated_at ?? offer.created_at, now),
      offerId: offer.id,
    };
  }

  if (offer.status === "expired") {
    const fade = expiredFadeMultiplier(offer.expires_at, now);
    if (fade <= 0) return null;

    return {
      amount,
      weight: fade * timeDecay(offer.expires_at ?? offer.created_at, now),
      offerId: offer.id,
    };
  }

  return null;
}

export async function expireDueOffers(artworkId?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from("offers")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString())
    .select("artwork_id");

  if (artworkId) {
    query = query.eq("artwork_id", artworkId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return [
    ...new Set(
      (data ?? [])
        .map((row) => row.artwork_id)
        .filter((artworkId): artworkId is string => typeof artworkId === "string"),
    ),
  ];
}

export async function recalculateArtworkMarketValue(
  artworkId: string,
  reason: MarketRecalcReason = "market_recalc",
  sourceOfferId?: string,
) {
  const supabase = getSupabase();

  const { data: artworkData, error: artworkError } = await supabase
    .from("artworks")
    .select("id, price_amount, price_currency")
    .eq("id", artworkId)
    .single();

  if (artworkError) throw artworkError;
  const artwork = artworkData as ArtworkRow;

  await expireDueOffers(artworkId);

  const [
    { data: offerRows, error: offersError },
    { data: saleRows, error: salesError },
    { data: currentMarket },
  ] = await Promise.all([
    supabase
      .from("offers")
      .select("id, amount, status, created_at, updated_at, expires_at")
      .eq("artwork_id", artworkId)
      .in("status", ["active", "accepted", "rejected", "expired"]),
    supabase
      .from("sales")
      .select("sale_price, created_at")
      .eq("artwork_id", artworkId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("artwork_market_value")
      .select("market_value, last_sale_price")
      .eq("artwork_id", artworkId)
      .maybeSingle(),
  ]);

  if (offersError) throw offersError;
  if (salesError) throw salesError;

  const askingPrice = toNumber(artwork.price_amount);
  const previousMarketValue = toNumber((currentMarket as MarketRow | null)?.market_value);
  const lowballFloor =
    Math.max(previousMarketValue || askingPrice, askingPrice) * LOWBALL_FLOOR_RATIO;
  const signals = ((offerRows as OfferRow[] | null) ?? [])
    .map((offer) => signalForOffer(offer, lowballFloor))
    .filter((signal): signal is WeightedSignal => Boolean(signal));

  const activeSignals = signals.filter((signal) => {
    const offer = (offerRows as OfferRow[]).find((row) => row.id === signal.offerId);
    return offer?.status === "active";
  });

  const latestSale = (saleRows as SaleRow[] | null)?.[0];
  const lastSalePrice = latestSale
    ? toNumber(latestSale.sale_price)
    : toNumber((currentMarket as MarketRow | null)?.last_sale_price);
  const lastSaleSignal = latestSale
    ? lastSalePrice * timeDecay(latestSale.created_at)
    : lastSalePrice;
  const highestActiveOffer =
    activeSignals.length > 0 ? Math.max(...activeSignals.map((signal) => signal.amount)) : 0;
  const averageOfferSignal = weightedAverage(signals);

  const weightedPieces: WeightedSignal[] = [];
  if (lastSaleSignal > 0) weightedPieces.push({ amount: lastSaleSignal, weight: LAST_SALE_WEIGHT });
  if (highestActiveOffer > 0)
    weightedPieces.push({ amount: highestActiveOffer, weight: HIGHEST_OFFER_WEIGHT });
  if (averageOfferSignal > 0)
    weightedPieces.push({ amount: averageOfferSignal, weight: AVERAGE_OFFER_WEIGHT });

  const marketValue = roundMoney(
    weightedPieces.length ? weightedAverage(weightedPieces) : askingPrice,
  );
  const averageActiveOffers = roundMoney(weightedAverage(activeSignals));
  const snapshot = {
    artwork_id: artworkId,
    market_value: marketValue,
    last_sale_price: lastSalePrice || null,
    highest_active_offer: highestActiveOffer || null,
    average_active_offers: averageActiveOffers || null,
    signal_count: activeSignals.length,
    currency: artwork.price_currency,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("artwork_market_value")
    .upsert(snapshot, { onConflict: "artwork_id" });

  if (upsertError) throw upsertError;

  const historyType =
    reason === "offer_accepted"
      ? "sale"
      : reason === "market_recalc"
        ? "market_recalc"
        : "offer_update";
  const { error: historyError } = await supabase.from("price_history").insert({
    artwork_id: artworkId,
    value: marketValue,
    type: historyType,
    sale_price: historyType === "sale" ? lastSalePrice || marketValue : null,
    highest_active_offer: highestActiveOffer || null,
    average_active_offers: averageActiveOffers || null,
    signal_count: activeSignals.length,
    source_offer_id: sourceOfferId,
  });

  if (historyError) throw historyError;

  return snapshot;
}
