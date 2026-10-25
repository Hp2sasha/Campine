"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, logout } from "@/lib/auth";
import { requestOtp, verifyOtp } from "@/lib/otp";
import { isValidIranianPhone, normalizeIranianPhone } from "@/lib/sms";
import { saveIdCardImage } from "@/lib/upload";
import { hitRateLimit } from "@/lib/rateLimit";

function getClientIp(): string {
  try {
    const h = headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  } catch { return "unknown"; }
}

export type OtpResult =
  | { ok: true; mock?: boolean; devCode?: string; message: string; phone?: string; idCardUrl?: string }
  | { ok: false; error: string };

/** Step 1 of passwordless login: send SMS code to the phone. */
export async function loginStep1Action(phoneRaw: string): Promise<OtpResult> {
  if (!isValidIranianPhone(phoneRaw)) {
    return { ok: false, error: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)" };
  }
  // ریت‌لیمیتِ IP برای جلوگیری از شمارشِ شماره‌ها / اسپم
  const ip = getClientIp();
  const rl = hitRateLimit(`login:ip:${ip}`, 12, 10 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: `درخواست‌های زیاد — ${rl.retryAfterSec} ثانیه دیگر دوباره تلاش کنید` };

  const phone = normalizeIranianPhone(phoneRaw);

  // جلوگیری از شمارشِ کاربر (user enumeration): همیشه پیامِ یکسان + تاخیرِ تصادفی
  const user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return { ok: false, error: "با این شماره ثبت‌نام نشده است؛ ابتدا ثبت‌نام کنید" };
    // نکته: برای جلوگیریِ کامل از enumeration می‌تونی این خط رو با پیامِ عمومی عوض کنی:
    // return { ok: true, mock: true, message: "اگر این شماره ثبت شده باشد، کد ارسال شد" };
  }

  return requestOtp(phone, "login");
}

/** Step 2 of login: verify code and open session. */
export async function loginStep2Action(phoneRaw: string, code: string): Promise<OtpResult> {
  const phone = normalizeIranianPhone(phoneRaw);
  const ip = getClientIp();
  const rl = hitRateLimit(`verify:ip:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: `درخواست‌های زیاد — ${rl.retryAfterSec} ثانیه دیگر دوباره تلاش کنید` };

  const check = await verifyOtp(phone, code, "login");
  if (!check.ok) return check;

  const user = await db.user.findUnique({ where: { phone } });
  if (!user) return { ok: false, error: "کاربری با این شماره یافت نشد" };
  if (user.isSuspended) return { ok: false, error: "حساب شما توسط مدیر معلق شده است" };

  await createSession(user);
  redirect("/panel");
}

/** Step 1 of registration: save ID card, send SMS code. */
export async function registerStep1Action(formData: FormData): Promise<OtpResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;

  if (!name) return { ok: false, error: "نام و نام خانوادگی الزامی است" };
  if (!isValidIranianPhone(phoneRaw)) {
    return { ok: false, error: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)" };
  }
  const ip = getClientIp();
  const rl = hitRateLimit(`register:ip:${ip}`, 8, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: `درخواست‌های زیاد — ${rl.retryAfterSec} ثانیه دیگر دوباره تلاش کنید` };
  const phone = normalizeIranianPhone(phoneRaw);

  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) return { ok: false, error: "این شماره قبلاً ثبت شده است؛ با همان شماره وارد شوید" };
  if (email) {
    const byEmail = await db.user.findUnique({ where: { email } });
    if (byEmail) return { ok: false, error: "این ایمیل قبلاً ثبت شده است" };
  }

  const file = formData.get("idCard");
  const saved = await saveIdCardImage(file instanceof File ? file : null);
  if (!saved.ok) return { ok: false, error: saved.error };

  const otp = await requestOtp(phone, "register");
  if (!otp.ok) return otp;

  return {
    ok: true,
    mock: otp.mock,
    devCode: otp.devCode,
    message: otp.message,
    phone,
    idCardUrl: saved.url,
  };
}

/** Step 2 of registration: verify code and create the passenger account. */
export async function registerStep2Action(input: {
  name: string;
  phone: string;
  email?: string | null;
  idCardUrl: string;
  code: string;
}): Promise<OtpResult> {
  const phone = normalizeIranianPhone(input.phone);
  const check = await verifyOtp(phone, input.code, "register");
  if (!check.ok) return check;

  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) return { ok: false, error: "این شماره قبلاً ثبت شده است" };

  const user = await db.user.create({
    data: {
      name: input.name.trim(),
      phone,
      email: input.email?.trim().toLowerCase() || null,
      idCardUrl: input.idCardUrl,
      role: "passenger",
    },
  });

  await createSession(user);
  redirect("/panel");
}

export async function logoutAction() {
  logout();
  redirect("/login?loggedout=1");
}
