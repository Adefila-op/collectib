import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { errorHandler } from "./middleware.js";
import authRoutes from "./routes/auth.js";
import artworkRoutes from "./routes/artworks.js";
import offerRoutes from "./routes/offers.js";
import orderRoutes from "./routes/orders.js";
import walletRoutes from "./routes/wallet.js";
import webhookRoutes from "./routes/webhooks.js";
import cronRoutes from "./routes/cron.js";
import adminRoutes from "./routes/admin.js";
import promoRoutes from "./routes/promos.js";

export const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.appOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "collectibles-api",
    checkedAt: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);
