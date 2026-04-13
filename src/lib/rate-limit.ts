/**
 * Fixed-window limiter with Redis support (multi-instance),
 * falling back to in-memory when REDIS_URL is not configured.
 */
import Redis from "ioredis";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let redisClient: Redis | null = null;

function redis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redisClient) {
    redisClient = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableAutoPipelining: true,
    });
  }
  return redisClient;
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number; retryAfterMs: number };

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisInstance = redis();
  if (redisInstance) {
    try {
      if (redisInstance.status !== "ready") {
        await redisInstance.connect();
      }
      const now = Date.now();
      const fullKey = `rl:${key}`;
      const count = await redisInstance.incr(fullKey);
      if (count === 1) {
        await redisInstance.pexpire(fullKey, windowMs);
      }
      const ttlMsRaw = await redisInstance.pttl(fullKey);
      const ttlMs = ttlMsRaw > 0 ? ttlMsRaw : windowMs;
      const resetAt = now + ttlMs;
      if (count > max) {
        return {
          ok: false,
          remaining: 0,
          resetAt,
          retryAfterMs: Math.max(0, ttlMs),
        };
      }
      return {
        ok: true,
        remaining: Math.max(0, max - count),
        resetAt,
      };
    } catch {
      // fallback to memory below
    }
  }

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
