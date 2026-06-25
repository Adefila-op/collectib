import dotenv from "dotenv";

dotenv.config();

const configuredOrigins = (process.env.APP_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const appOrigins = Array.from(
  new Set([...configuredOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]),
);

export const config = {
  port: Number(process.env.PORT ?? 8787),
  appOrigins,
  jwtSecret: process.env.JWT_SECRET ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  heliusApiKey: process.env.HELIUS_API_KEY ?? "",
  heliusWebhookSecret: process.env.HELIUS_WEBHOOK_SECRET ?? "",
  flutterwaveSecretHash: process.env.FLUTTERWAVE_SECRET_HASH ?? "",
  flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY ?? "",
  paymentRedirectUrl: process.env.PAYMENT_REDIRECT_URL ?? "",
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
