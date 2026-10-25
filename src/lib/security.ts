/**
 * Simple in-memory rate-limit & brute-force guard for OTP.
 * For production with multiple instances use Redis.
 */
const otpAttempts = new Map<string, { count: number; lockedUntil: number }>();
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 دقیقه
const CODE_TTL_MS = 180 * 1000;

export function isOtpLocked(phone: string): number | null {
  const rec = otpAttempts.get(phone);
  if (!rec) return null;
  if (Date.now() < rec.lockedUntil) {
    return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
  }
  // قفل تمام شده — پاک کن
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    otpAttempts.delete(phone);
    return null;
  }
  return null;
}

export function recordOtpAttempt(phone: string, success: boolean) {
  if (success) {
    otpAttempts.delete(phone);
    return;
  }
  const cur = otpAttempts.get(phone) ?? { count: 0, lockedUntil: 0 };
  cur.count += 1;
  if (cur.count >= LOCK_AFTER) {
    cur.lockedUntil = Date.now() + LOCK_MS;
    cur.count = 0; // بعد از قفل، شمارش صفر
  }
  otpAttempts.set(phone, cur);
}

export function getSessionSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to a strong random value (≥32 chars) in production");
    }
    console.warn("[security] Using dev fallback SESSION_SECRET — set a strong value for production!");
    return new TextEncoder().encode("safaryar-dev-secret-please-change-in-production-32+chars");
  }
  return new TextEncoder().encode(raw);
}
