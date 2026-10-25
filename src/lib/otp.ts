import { db } from "@/lib/db";
import { sendSms, normalizeIranianPhone } from "@/lib/sms";
import { isOtpLocked, recordOtpAttempt } from "./security";
import { hitRateLimit } from "./rateLimit";

const CODE_TTL_SECONDS = 180;
export const RESEND_COOLDOWN_SECONDS = 60;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestOtp(phoneRaw: string, purpose: "login" | "register") {
  const phone = normalizeIranianPhone(phoneRaw);

  // ریت‌لیمیت کلی برای هر شماره (جلوگیری از اسپمِ پیامک)
  const rlPhone = hitRateLimit(`otp:phone:${phone}`, 4, 10 * 60 * 1000);
  if (!rlPhone.ok) return { ok: false as const, error: `درخواست‌های زیاد برای این شماره — ${rlPhone.retryAfterSec} ثانیه دیگر تلاش کنید` };

  const last = await db.smsCode.findFirst({
    where: { phone, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - (Date.now() - last.createdAt.getTime()) / 1000);
    return { ok: false as const, error: `لطفاً ${wait} ثانیه دیگر دوباره تلاش کنید` };
  }

  const code = generateCode();
  await db.smsCode.create({
    data: {
      phone,
      code,
      purpose,
      expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
    },
  });

  const text =
    purpose === "register"
      ? `کمپینه: کد تایید ثبت‌نام شما ${code} است.`
      : `کمپینه: کد ورود شما ${code} است.`;
  const sent = await sendSms(phone, text, code);

  if (!sent.ok) {
    return { ok: false as const, error: sent.message };
  }

  return {
    ok: true as const,
    mock: sent.mock,
    devCode: sent.mock ? code : undefined,
    message: sent.mock ? "کد تایید (حالت نمایشی) ارسال شد" : "کد تایید پیامک شد",
  };
}

export async function verifyOtp(phoneRaw: string, code: string, purpose: "login" | "register") {
  const phone = normalizeIranianPhone(phoneRaw);

  // قفلِ بروت‌فورس: ۵ تلاشِ اشتباه → ۱۵ دقیقه قفل
  const lockedSec = isOtpLocked(phone);
  if (lockedSec) {
    return { ok: false as const, error: `به دلیل تلاش‌های ناموفق، ${lockedSec} ثانیه دیگر دوباره تلاش کنید` };
  }

  const record = await db.smsCode.findFirst({
    where: { phone, purpose, code: code.trim(), usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) {
    recordOtpAttempt(phone, false);
    return { ok: false as const, error: "کد تایید نادرست است" };
  }
  if (record.expiresAt.getTime() < Date.now()) {
    recordOtpAttempt(phone, false);
    return { ok: false as const, error: "کد تایید منقضی شده است" };
  }

  await db.smsCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  recordOtpAttempt(phone, true);
  return { ok: true as const };
}
