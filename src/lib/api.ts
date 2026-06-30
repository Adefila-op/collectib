const configuredApiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const isBrowser = typeof window !== "undefined";
const isLocalApiUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredApiBaseUrl);
const isLocalAppHost = isBrowser && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const API_BASE_URL = isLocalApiUrl && isBrowser && !isLocalAppHost ? "" : configuredApiBaseUrl;
const AUTH_TOKEN_KEY = "collectibles.authToken";
const WALLET_ADDRESS_KEY = "collectibles.walletAddress";
const AUTH_DEVICE_ID_KEY = "collectibles.authDeviceId";
const KNOWN_AUTH_DEVICE_KEY = "collectibles.knownAuthDevice";
export const AUTH_STATE_CHANGED_EVENT = "collectibles.authStateChanged";

export type AuthProfile = {
  id: string;
  wallet_address: string;
  display_name?: string | null;
  avatar_url?: string | null;
  gender?: "female" | "male" | "non_binary" | "prefer_not_to_say" | null;
  dashboard_type?: "collector" | "artist" | null;
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

type SignupResponse =
  | VerifyResponse
  | {
      needsVerification: true;
      email: string;
      message: string;
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
  status: "draft" | "listed" | "owned" | "reserved" | "sold" | "delisted";
  created_at?: string;
  artists?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export type Artist = {
  id: string;
  databaseId: string;
  name: string;
  slug?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  practice?: string | null;
  collectionTitle: string;
  isFeatured: boolean;
  ownedCount: number;
  availableCount: number;
  artworks: Artwork[];
};

export type ArtistCollection = {
  id: string;
  title: string;
  owner: string;
  artist: Artist;
  artworks: Artwork[];
};

export type Offer = {
  id: string;
  artwork_id: string;
  buyer_profile_id: string;
  seller_profile_id: string;
  amount: number | string;
  currency: "USD" | "USDC" | "SOL";
  message?: string | null;
  payment_provider?: "wallet" | "flutterwave" | null;
  payment_reference?: string | null;
  settlement_signature?: string | null;
  status:
    | "pending_payment"
    | "payment_review"
    | "crypto_submitted"
    | "active"
    | "accepted"
    | "rejected"
    | "withdrawn"
    | "expired";
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
  affiliate_profile_id?: string | null;
  affiliate_code?: string | null;
  amount: number | string;
  currency: "USD" | "USDC" | "SOL";
  payment_provider: "wallet" | "flutterwave";
  payment_reference?: string | null;
  settlement_signature?: string | null;
  status: string;
  expires_at?: string | null;
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

export type WalletTransaction = {
  signature: string;
  slot?: number;
  blockTime?: number | null;
  err?: unknown;
  memo?: string | null;
};

export type PromoBanner = {
  greeting: string;
  message: string;
  ctaLabel: string;
  detailsTitle: string;
  detailsBody: string;
  updatedAt?: string;
};

export type MeProfile = AuthProfile & {
  email?: string | null;
  artist_id?: string | null;
  created_at?: string | null;
  stats: {
    connectedWallets: number;
    offers: number;
    orders: number;
  };
};

export type ActivityItem = {
  id: string;
  type: "offer" | "order";
  title: string;
  subject: string;
  value: string;
  status: string;
  imageUrl?: string | null;
  createdAt?: string;
  time: string;
};

export type PortfolioSummary = {
  stats: {
    portfolioValue: number;
    totalArtworks: number;
    totalSpent: number;
    totalReturn: number;
    solBalance: number;
    usdcBalance: number;
    walletNfts: number;
    provenanceCertificates: number;
  };
  artworks: Artwork[];
  wallet: {
    solBalance: number;
    usdcBalance: number;
    wallets: Array<{
      walletAddress: string;
      solBalance: number;
      usdcBalance: number;
      checkedAt?: string | null;
      nfts: WalletAssetSummary[];
    }>;
    nfts: WalletAssetSummary[];
  };
  provenanceCertificates: ProvenanceCertificate[];
};

export type WalletAssetSummary = {
  id: string;
  name: string;
  symbol: string;
  imageUrl?: string | null;
  walletAddress: string;
  kind: "wallet_nft";
};

export type ProvenanceCertificate = {
  id: string;
  artwork_id: string;
  holder_profile_id: string;
  source: "order_paid" | "offer_accepted" | string;
  source_id: string;
  status: "active" | "burned" | "revoked" | string;
  onchain_status?: "pending_mint" | "minted" | "pending_burn" | "burned" | string | null;
  chain?: string | null;
  certificate_mint?: string | null;
  mint_signature?: string | null;
  burn_signature?: string | null;
  issued_at?: string;
  burned_at?: string | null;
  artworks?: Artwork | null;
};

export const DEFAULT_PROMO_BANNER: PromoBanner = {
  greeting: "Hello Collector.",
  message: "Get free delivery every $20 purchase",
  ctaLabel: "Learn More",
  detailsTitle: "Free delivery on $20 purchases",
  detailsBody:
    "Enjoy free delivery whenever your checkout total reaches $20 or more. The offer applies automatically to eligible marketplace purchases before payment.",
};

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  if (isBrowser) {
    headers.set("x-auth-device-id", getAuthDeviceId());
  }

  const token = getAuthToken();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and API URL.");
  }

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

export function isSignedIn() {
  return Boolean(getAuthToken());
}

export function getWalletAddress() {
  return localStorage.getItem(WALLET_ADDRESS_KEY);
}

export function getAuthDeviceId() {
  let deviceId = localStorage.getItem(AUTH_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(AUTH_DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function hasKnownAuthDevice() {
  return localStorage.getItem(KNOWN_AUTH_DEVICE_KEY) === "true" || Boolean(getAuthToken());
}

export function markKnownAuthDevice() {
  localStorage.setItem(KNOWN_AUTH_DEVICE_KEY, "true");
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
  markKnownAuthDevice();
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export function saveWalletAddress(walletAddress: string) {
  localStorage.setItem(WALLET_ADDRESS_KEY, walletAddress);
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(WALLET_ADDRESS_KEY);
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export function checkAuthRecognition() {
  return request<{ recognized: boolean }>("/api/auth/recognition", {
    method: "POST",
    body: JSON.stringify({ deviceId: getAuthDeviceId() }),
  });
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

export function signUpWithEmail(payload: {
  fullName: string;
  email: string;
  password: string;
  gender?: "female" | "male" | "non_binary" | "prefer_not_to_say";
  dashboardType: "collector" | "artist";
}) {
  return request<SignupResponse>("/api/auth/signup", {
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

export function verifyEmailToken(token: string, refreshToken?: string) {
  return request<VerifyResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token, refreshToken }),
  });
}

export function resendVerificationEmail(email: string) {
  return request<{ message: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function requestPasswordReset(email: string) {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(payload: {
  email: string;
  accessToken: string;
  refreshToken: string;
  password: string;
}) {
  return request<VerifyResponse>("/api/auth/reset-password", {
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

export function getWalletTransactions(walletAddress: string, limit = 20) {
  return request<{ signatures: WalletTransaction[] }>(
    `/api/wallets/${encodeURIComponent(walletAddress)}/transactions?limit=${limit}`,
  );
}

export function getHealth() {
  return request<{ ok: boolean; service: string; checkedAt: string }>("/api/health");
}

export function getMe() {
  return request<{ profile: MeProfile }>("/api/me");
}

export function updateDashboardType(dashboardType: "collector" | "artist") {
  return request<{ profile: MeProfile }>("/api/me/dashboard-type", {
    method: "PATCH",
    body: JSON.stringify({ dashboardType }),
  });
}

// ── Onboarding draft helpers ────────────────────────────────────────────────
const ONBOARDING_DRAFT_KEY = "collectibles.onboardingDraft";

export type OnboardingDraft = {
  role?: "collector" | "artist";
  artStyles?: string[];
  budgetRange?: string;
  investmentGoal?: string;
  artMedium?: string[];
  pricingRange?: string;
};

export function getOnboardingDraft(): OnboardingDraft {
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function patchOnboardingDraft(patch: Partial<OnboardingDraft>) {
  const current = getOnboardingDraft();
  localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearOnboardingDraft() {
  localStorage.removeItem(ONBOARDING_DRAFT_KEY);
}

export function saveOnboardingPrefs(prefs: {
  artStyles?: string[];
  budgetRange?: string;
  investmentGoal?: string;
  artMedium?: string[];
  pricingRange?: string;
}) {
  return request<{ ok: boolean }>("/api/me/onboarding-prefs", {
    method: "PATCH",
    body: JSON.stringify(prefs),
  });
}

export function getActivity() {
  return request<{ activities: ActivityItem[] }>("/api/me/activity");
}

export function getPortfolio() {
  return request<PortfolioSummary>("/api/me/portfolio");
}

export function getHomePromoBanner() {
  return request<{ banner: PromoBanner }>("/api/promos/home-banner");
}

export function getArtworks(status = "market") {
  return request<{ artworks: Artwork[] }>(`/api/artworks?status=${encodeURIComponent(status)}`);
}

export function getArtwork(id: string) {
  return request<{ artwork: Artwork }>(`/api/artworks/${encodeURIComponent(id)}`);
}

export function getArtists() {
  return request<{ artists: Artist[] }>("/api/artists");
}

export function getArtist(id: string) {
  return request<{ artist: Artist }>(`/api/artists/${encodeURIComponent(id)}`);
}

export function getArtistCollections() {
  return request<{ collections: ArtistCollection[] }>("/api/artists/collections");
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export async function uploadArtworkImage(file: File) {
  const data = await readFileAsDataUrl(file);

  return request<{ path: string; imageUrl: string }>("/api/artworks/upload-image", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      data,
    }),
  });
}

export function getOffers() {
  return request<{ offers: Offer[] }>("/api/offers");
}

export function createOffer(payload: {
  artworkId: string;
  amount: number;
  currency: "USD" | "USDC" | "SOL";
  paymentProvider: "wallet" | "flutterwave";
  message?: string;
}) {
  return request<{ offer: Offer; paymentReference?: string; checkoutUrl?: string }>("/api/offers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitOfferWalletPayment(offerId: string, walletAddress: string, txSignature: string) {
  return request<{ offer: Offer }>(`/api/offers/${encodeURIComponent(offerId)}/wallet-payment`, {
    method: "POST",
    body: JSON.stringify({ walletAddress, txSignature }),
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
  paymentProvider: "wallet" | "flutterwave";
  affiliateCode?: string;
}) {
  return request<{ order: Order }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelOrder(orderId: string) {
  return request<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
  });
}

export function recordAffiliateClick(payload: {
  affiliateCode: string;
  artworkId: string;
  visitorKey?: string;
}) {
  return request<{ recorded: boolean }>("/api/affiliates/clicks", {
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

export function verifyFlutterwaveCheckout(payload: { txRef: string; transactionId?: string }) {
  return request<{ verified: boolean; order: Order; status?: string }>("/api/orders/flutterwave/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function getAdminPromoBanner() {
  return request<{ banner: PromoBanner }>("/api/admin/promo-banner");
}

export function updateAdminPromoBanner(payload: PromoBanner) {
  return request<{ banner: PromoBanner }>("/api/admin/promo-banner", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAdminTableData<T>(table: string) {
  return request<{ data: T[] }>(`/api/admin/data/${table}`);
}

export function patchAdminTableData<T>(table: string, id: string, payload: Partial<T>) {
  return request<{ data: T }>(`/api/admin/data/${table}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminTableData(table: string, id: string) {
  return request<{ success: boolean }>(`/api/admin/data/${table}/${id}`, {
    method: "DELETE",
  });
}
