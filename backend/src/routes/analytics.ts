import { Router, Request, Response } from "express";
import { getPlatformAnalytics } from "../db.js";
import { PlatformAnalytics } from "../types.js";

const router = Router();

let cachedAnalytics: { data: PlatformAnalytics; expiresAt: number } | null = null;
const ANALYTICS_TTL_MS = 10_000;

/**
 * GET /api/analytics
 * Returns aggregated unique wallet counts, escrow volume, Open Gig stats, and AI audit counts.
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    if (cachedAnalytics && cachedAnalytics.expiresAt > now) {
      res.json({ success: true, data: cachedAnalytics.data });
      return;
    }

    const data = await getPlatformAnalytics();
    cachedAnalytics = { data, expiresAt: now + ANALYTICS_TTL_MS };

    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in GET /api/analytics:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to compute platform analytics",
    });
  }
});

export default router;
