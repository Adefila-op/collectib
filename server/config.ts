import dotenv from "dotenv";

dotenv.config();

const configuredOrigins = (process.env.APP_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
const productionAppUrl = "https://collectibles-vite.vercel.app";
const isProductionDeployment = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value);
}

function resolvePublicAppUrl() {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured && !(isProductionDeployment && isLocalUrl(configured))) {
    return configured.replace(/\/$/, "");
  }
  if (vercelOrigin) return vercelOrigin.replace(/\/$/, "");
  if (isProductionDeployment) return productionAppUrl;
  return (configuredOrigins[0] ?? "http://localhost:5173").replace(/\/$/, "");
}

const appOrigins = Array.from(
  new Set(
    [
      ...configuredOrigins,
      vercelOrigin,
      "https://collectib.muyeezadefila29.workers.dev",
      productionAppUrl,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ].filter(Boolean),
  ),
);

export const config = {
  port: Number(process.env.PORT ?? 8787),
  appOrigins,
  jwtSecret: process.env.JWT_SECRET ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  heliusApiKey: process.env.HELIUS_API_KEY ?? "",
  heliusWebhookSecret: process.env.HELIUS_WEBHOOK_SECRET ?? "",
  flutterwaveSecretHash: process.env.FLUTTERWAVE_SECRET_HASH ?? "",
  flutterwaveSecretKey:
    process.env.FLUTTERWAVE_SECRET_KEY ??
    process.env.FLW_SECRET_KEY ??
    process.env.FLUTTERWAVE_API_KEY ??
    process.env.Flutterwave_secret_key ??
    "",
  paymentRedirectUrl: process.env.PAYMENT_REDIRECT_URL ?? "",
  publicAppUrl: resolvePublicAppUrl(),
  cronSecret: process.env.CRON_SECRET ?? "",
  adminWallets: (process.env.ADMIN_WALLETS ?? "")
    .split(",")
    .map((wallet) => wallet.trim())
    .filter(Boolean),
};

export function requireEnv(name: keyof typeof config) {
  const value = config[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
