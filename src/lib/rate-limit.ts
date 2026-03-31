/**
 * In-memory fixed window rate limiter (single Node instance).
 * For multi-instance deploy use Redis-backed limiter (e.g. Upstash).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number; retryAfterMs: number };

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  if (b.count >= max) {
    return {
      ok: false,
      remaining: 0,
      resetAt: b.resetAt,
      retryAfterMs: Math.max(0, b.resetAt - now),
    };
  }
  b.count += 1;
  return {
    ok: true,
    remaining: max - b.count,
    resetAt: b.resetAt,
  };
}

export function clientKeyFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
