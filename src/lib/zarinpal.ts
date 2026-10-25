/**
 * ZarinPal payment gateway integration (v4 REST API).
 *
 * Modes:
 *  - Real: set ZARINPAL_MERCHANT_ID to your merchant code.
 *  - Mock: leave ZARINPAL_MERCHANT_ID empty or set to "mock" to simulate
 *    the full payment flow locally (useful for demos & development).
 */

const SANDBOX = (process.env.ZARINPAL_SANDBOX ?? "true") !== "false";

const API_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4"
  : "https://api.zarinpal.com/pg/v4";

const STARTPAY_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://payment.zarinpal.com/pg/StartPay";

export function isMockPayment() {
  const id = process.env.ZARINPAL_MERCHANT_ID;
  return !id || id === "mock";
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function requestPayment(opts: {
  amountToman: number;
  description: string;
  callbackUrl: string;
}): Promise<{ authority: string; url: string }> {
  if (isMockPayment()) {
    const authority = `MOCK-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}`;
    return {
      authority,
      url: `${appUrl()}/payment/mock-gateway/${authority}`,
    };
  }

  const res = await fetch(`${API_BASE}/payment/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: opts.amountToman,
      currency: "IRT",
      description: opts.description,
      callback_url: opts.callbackUrl,
    }),
    cache: "no-store",
  });
  const json = await res.json();
  const authority = json?.data?.authority;
  if (!authority) {
    throw new Error(
      `ZarinPal request failed: ${JSON.stringify(json?.errors ?? json)}`
    );
  }
  return { authority, url: `${STARTPAY_BASE}/${authority}` };
}

export async function verifyPayment(opts: {
  amountToman: number;
  authority: string;
}): Promise<{ ok: boolean; refId: string | null; code: number }> {
  if (isMockPayment()) {
    // Mock gateway only sends Status=OK when the user "pays" successfully.
    return { ok: true, refId: `MOCKREF-${Date.now()}`, code: 100 };
  }

  const res = await fetch(`${API_BASE}/payment/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: opts.amountToman,
      authority: opts.authority,
    }),
    cache: "no-store",
  });
  const json = await res.json();
  const code = Number(json?.data?.code ?? json?.errors?.code ?? -1);
  // 100 = verified, 101 = already verified
  const ok = code === 100 || code === 101;
  return {
    ok,
    refId: json?.data?.ref_id ? String(json.data.ref_id) : null,
    code,
  };
}
