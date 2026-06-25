const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const AUTH_TOKEN_KEY = "collectibles.authToken";
const WALLET_ADDRESS_KEY = "collectibles.walletAddress";

export type AuthProfile = {
  id: string;
  wallet_address: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

type NonceResponse = {
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: string;
};

type VerifyResponse = {
  token: string;
  profile: AuthProfile;
};

export type Artwork = {
  id: string;
  seller_profile_id: string;
  artist_id?: string | null;
  title: string;
  description?: string | null;
  price_amount: number | string;
  price_currency: "USD" | "USDC" | "SOL";
  token_mint?: string | null;
  metadata_uri?: string | null;
  image_url?: string | null;
  status: string;
  created_at?: string;
  artists?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export type Offer = {
  id: string;
  artwork_id: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  amount: number | string;
  currency: "USD" | "USDC" | "SOL";
  message?: string | null;
  status: "active" | "accepted" | "rejected" | "withdrawn" | "expired";
  created_at?: string;
  artworks?: {
    title?: string | null;
    image_url?: string | null;
    seller_profile_id?: string | null;
  } | null;
};

export type Order = {
  id: string;
  artwork_id: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  amount: number | string;
  currency: "USD" | "USDC" | "SOL";
  payment_provider: "wallet" | "flutterwave" | "moonpay";
  payment_reference?: string | null;
  settlement_signature?: string | null;
  status: string;
  created_at?: string;
  artworks?: {
    title?: string | null;
    image_url?: string | null;
  } | null;
};

export type WalletOverview = {
  walletAddress: string;
  solBalance: number;
  lamports: number;
  assets: unknown[];
  pagination?: unknown;
  checkedAt: string;
};

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  const token = getAuthToken();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const body = (await response.json().catch(() => null)) as T | { error?: string } | null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "API request failed.";
    throw new Error(message);
  }

  return body as T;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getWalletAddress() {
  return localStorage.getItem(WALLET_ADDRESS_KEY);
}

export function getSessionProfileId() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, walletAddress: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(WALLET_ADDRESS_KEY, walletAddress);
}

export function saveWalletAddress(walletAddress: string) {
  localStorage.setItem(WALLET_ADDRESS_KEY, walletAddress);
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(WALLET_ADDRESS_KEY);
}

export function createLoginNonce(walletAddress: string) {
  return request<NonceResponse>("/api/auth/nonce", {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
}

export function verifyWalletSignature(walletAddress: string, signature: number[]) {
  return request<VerifyResponse>("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ walletAddress, signature }),
  });
}

export function signUpWithEmail(payload: { fullName: string; email: string; password: string }) {
  return request<VerifyResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginWithEmail(payload: { email: string; password: string }) {
  return request<VerifyResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getWalletNfts(walletAddress: string) {
  return request<{ assets: unknown[]; pagination?: unknown }>(
    `/api/wallets/${encodeURIComponent(walletAddress)}/nfts`,
  );
}

export function getWalletOverview(walletAddress: string) {
  return request<WalletOverview>(`/api/wallets/${encodeURIComponent(walletAddress)}/overview`);
}

export function getHealth() {
  return request<{ ok: boolean; service: string; checkedAt: string }>("/api/health");
}

export function getArtworks(status = "listed") {
  return request<{ artworks: Artwork[] }>(`/api/artworks?status=${encodeURIComponent(status)}`);
}

export function getArtwork(id: string) {
  return request<{ artwork: Artwork }>(`/api/artworks/${encodeURIComponent(id)}`);
}

export function createArtwork(payload: {
  title: string;
  artistId?: string;
  description?: string;
  priceAmount: number;
  priceCurrency: "USD" | "USDC" | "SOL";
  tokenMint?: string;
  metadataUri?: string;
  imageUrl?: string;
}) {
  return request<{ artwork: Artwork }>("/api/artworks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOffers() {
  return request<{ offers: Offer[] }>("/api/offers");
}

export function createOffer(payload: {
  artworkId: string;
  amount: number;
  currency: "USD" | "USDC" | "SOL";
  message?: string;
}) {
  return request<{ offer: Offer }>("/api/offers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOfferStatus(id: string, status: "accepted" | "rejected" | "withdrawn") {
  return request<{ offer: Offer }>(`/api/offers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getOrders() {
  return request<{ orders: Order[] }>("/api/orders");
}

export function createOrder(payload: {
  artworkId: string;
  paymentProvider: "wallet" | "flutterwave" | "moonpay";
}) {
  return request<{ order: Order }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startFlutterwaveCheckout(orderId: string) {
  return request<{ paymentReference: string; checkoutUrl: string }>(
    `/api/orders/${encodeURIComponent(orderId)}/flutterwave`,
    { method: "POST" },
  );
}

export function submitCryptoPayment(orderId: string, walletAddress: string, txSignature: string) {
  return request<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/crypto-payment`, {
    method: "POST",
    body: JSON.stringify({ walletAddress, txSignature }),
  });
}

export function getAdminSummary() {
  return request<{
    stats: Record<string, number>;
    recentOrders: Order[];
    recentWebhooks: Array<{
      id: string;
      provider: string;
      event_type: string;
      external_id?: string | null;
      created_at?: string;
    }>;
  }>("/api/admin/summary");
}
