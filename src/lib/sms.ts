const KAVENEGAR_BASE = "https://api.kavenegar.com/v1";

type SendResult = {
  ok: boolean;
  mock: boolean;
  devCode?: string;
  message: string;
};

function normalizePhone(phone: string): string {
  // Accept 09xxxxxxxxx, 9xxxxxxxxx, +989xxxxxxxxx → 09xxxxxxxxx
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  else if (p.startsWith("98")) p = "0" + p.slice(2);
  else if (p.startsWith("9") && p.length === 10) p = "0" + p;
  return p;
}

export function isValidIranianPhone(phone: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(phone));
}

export function normalizeIranianPhone(phone: string): string {
  return normalizePhone(phone);
}

export async function sendSms(phone: string, message: string, code?: string): Promise<SendResult> {
  const receptor = normalizePhone(phone);
  const apiKey = process.env.KAVENEGAR_API_KEY;

  // Mock mode (no API key): the code is returned to the caller and shown in the UI.
  if (!apiKey || apiKey === "mock") {
    console.log(`[SMS mock] to=${receptor} :: ${message}`);
    return { ok: true, mock: true, devCode: code, message: "کد تایید (حالت نمایشی): " + (code ?? "") };
  }

  try {
    const sender = process.env.KAVENEGAR_SENDER || "100086633";
    const url = `${KAVENEGAR_BASE}/${apiKey}/sms/send.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ receptor, sender, message }),
    });
    const data = (await res.json()) as { return?: { status?: number; message?: string } };
    if (res.ok && data.return?.status === 200) {
      return { ok: true, mock: false, message: "پیامک ارسال شد" };
    }
    console.error("[SMS kavenegar] failed:", data);
    return { ok: false, mock: false, message: data.return?.message || "ارسال پیامک ناموفق بود" };
  } catch (err) {
    console.error("[SMS kavenegar] error:", err);
    return { ok: false, mock: false, message: "ارتباط با سرویس پیامک برقرار نشد" };
  }
}
