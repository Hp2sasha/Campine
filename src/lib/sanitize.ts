/**
 * خالی کردنِ متن از تگ‌های HTML/اسکریپت و محدود کردنِ طول
 */
export function sanitizeText(input: string, maxLen = 500): string {
  if (!input) return "";
  // حذفِ تگ‌های HTML
  let s = input.replace(/<[^>]*>/g, "").trim();
  // حذفِ کاراکترهای کنترلی خطرناک
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

export function sanitizeUrl(input: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  // فقط https/http یا مسیرِ داخلی
  if (s.startsWith("/") || s.startsWith("https://") || s.startsWith("http://")) {
    if (s.length > 800) return s.slice(0, 800);
    return s;
  }
  return null;
}

export function assertOrigin() {
  // Next Server Actions خودش origin رو چک می‌کنه ولی برای دابل‌چک:
  try {
    const { headers } = require("next/headers");
    const h = headers();
    const origin = h.get("origin");
    const referer = h.get("referer");
    const host = h.get("host") || h.get("x-forwarded-host") || "";
    if (origin && !origin.includes(host) && !host.includes("e2b.app") && !host.includes("e2b.dev") && !host.includes("arena")) {
      // در حالتِ عادی باید هم‌دامنه باشه؛ e2b/arena استثنا برای پیش‌نمایش
      throw new Error("CSRF: origin mismatch");
    }
    if (!origin && referer && !referer.includes(host) && !host.includes("e2b.app") && !host.includes("e2b.dev") && !host.includes("arena")) {
      // بعضی مرورگرها origin نمی‌فرستن — referer چک
      // اجازه‌ی خالی رو می‌دیم ولی لاگ می‌کنیم
    }
  } catch (e) {
    // اگر headers() در دسترس نبود (build) نادیده بگیر
    if ((e as Error).message?.includes("CSRF")) throw e;
  }
}
