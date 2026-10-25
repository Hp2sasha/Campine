/**
 * Tiny in-memory rate limiter — for production with multiple pods use Redis.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function hitRateLimit(key: string, max: number, windowMs: number): { ok: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > max) {
    const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
    return { ok: false, remaining: 0, retryAfterSec };
  }
  return { ok: true, remaining: max - b.count };
}

// cleanup old buckets every 5 min
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    buckets.forEach((b, k) => { if (now >= b.resetAt) buckets.delete(k); });
  }, 5 * 60 * 1000).unref?.();
}
