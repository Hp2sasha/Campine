import { getDict } from "@/lib/i18n";
import { isMockPayment } from "@/lib/zarinpal";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Simulated bank gateway used when ZARINPAL_MERCHANT_ID is "mock".
 * Lets you test the full payment flow locally.
 */
export default async function MockGatewayPage({
  params,
}: {
  params: { authority: string };
}) {
  const dict = getDict();
  if (!isMockPayment()) notFound();

  const authority = params.authority;

  return (
    <main className="grid min-h-[80vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-3xl">
          🏦
        </div>
        <h1 className="mt-5 text-xl font-extrabold text-slate-900">
          {dict.payment.mockTitle}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">{dict.payment.mockSub}</p>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500" dir="ltr">
          Authority: <span className="font-mono text-slate-700">{authority}</span>
        </div>

        <div className="mt-6 space-y-3">
          <a
            href={`/api/payment/callback?Authority=${encodeURIComponent(authority)}&Status=OK`}
            className="block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            ✓ {dict.payment.mockPayOk}
          </a>
          <a
            href={`/api/payment/callback?Authority=${encodeURIComponent(authority)}&Status=NOK`}
            className="block rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
          >
            ✕ {dict.payment.mockPayFail}
          </a>
        </div>

        <p className="mt-6 text-xs text-slate-400">{dict.payment.mockNote}</p>
      </div>
    </main>
  );
}
