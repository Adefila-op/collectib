import { Router } from "express";
import { requireEnv } from "../config.js";
import { getSupabase } from "../db.js";

const router = Router();

router.get("/supabase-ping", async (req, res, next) => {
  try {
    const cronSecret = requireEnv("cronSecret");
    if (req.header("x-cron-secret") !== cronSecret && req.query.secret !== cronSecret) {
      return res.status(401).json({ error: "Invalid cron secret." });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("service_pings").insert({ source: "pxxl-cron" });

    if (error) throw error;

    return res.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

export default router;
