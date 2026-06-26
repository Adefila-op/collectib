import { Router } from "express";
import { getHomePromoBanner } from "../services/promo-banner.js";

const router = Router();

router.get("/home-banner", async (_req, res, next) => {
  try {
    const banner = await getHomePromoBanner();
    return res.json({ banner });
  } catch (error) {
    next(error);
  }
});

export default router;
