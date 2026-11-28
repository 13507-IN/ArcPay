import { Request, Response, NextFunction } from "express";

/**
 * Attaches strict HTTP security headers to all API responses.
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  next();
}

/**
 * Evaluates whether a request Origin is permitted by CORS policy.
 * Allows configured CORS_ORIGINS, localhost dev servers, and Vercel preview/prod domains.
 */
export function isAllowedCorsOrigin(origin?: string): boolean {
  if (!origin) return true; // Non-browser / server-to-server / curl

  const rawConfigured = process.env.CORS_ORIGINS?.trim();
  if (rawConfigured === "*") return true;

  if (rawConfigured) {
    const allowedList = rawConfigured
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowedList.includes(origin.toLowerCase())) {
      return true;
    }
  }

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.app")
    ) {
      return true;
    }
  } catch {
    return false;
  }

  // If no explicit restriction is configured, remain permissive only in non-production
  return !rawConfigured && process.env.NODE_ENV !== "production";
}

interface RateBucket {
  count: number;
  resetAt: number;
}

/**
 * Lightweight in-memory fixed-window rate limiter with bounded map cleanup.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = "Too many requests, please slow down." } = options;
  const buckets = new Map<string, RateBucket>();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, Math.max(windowMs, 30_000));
  cleanupTimer.unref?.();

  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers["x-forwarded-for"];
    const clientIp =
      (Array.isArray(forwarded)
        ? forwarded[0]
        : typeof forwarded === "string"
        ? forwarded.split(",")[0]
        : req.ip) || "unknown";
    const key = clientIp.trim();
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + windowMs };
      buckets.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    next();
  };
}
