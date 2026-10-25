import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatToman } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: { status?: string; booking?: string; ref?: string };
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await getCurrentUser();

  const success = searchParams.status === "success";
  const bookingId = Number(searchParams.booking);
  const booking = Number.isFinite(bookingId)
    ? await db.booking.findUnique({
        where: { id: bookingId },
        include: { trip: true, payment: true },
      })
    : null;

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl ${
            success ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          {success ? "✅" : "❌"}
        </div>

        <h1 className="mt-6 text-2xl font-extrabold text-slate-900">
          {success ? dict.payment.successTitle : dict.payment.failTitle}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {success ? dict.payment.successSub : dict.payment.failSub}
        </p>

        {booking && (
          <div className="mt-8 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-start text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{dict.common.code}</span>
              <span className="font-bold text-slate-800">{booking.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{dict.common.title}</span>
              <span className="font-bold text-slate-800">{booking.trip.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{dict.booking.totalAmount}</span>
              <span className="font-bold text-slate-800">
                {formatToman(booking.trip.price * booking.seats, locale)}
              </span>
            </div>
            {success && searchParams.ref && (
              <div className="flex justify-between">
                <span className="text-slate-500">{dict.payment.refId}</span>
                <span className="font-mono text-xs font-bold text-slate-800" dir="ltr">
                  {searchParams.ref}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user && (
            <Link
              href="/panel/bookings"
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {dict.payment.backPanel}
            </Link>
          )}
          {!success && bookingId > 0 && (
            <form action="/api/payment/initiate" method="POST">
              <input type="hidden" name="bookingId" value={bookingId} />
              <button
                type="submit"
                className="rounded-xl border border-brand-200 bg-brand-50 px-6 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
              >
                {dict.common.pay}
              </button>
            </form>
          )}
          <Link
            href="/trips"
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            {dict.booking.browseTrips}
          </Link>
        </div>
      </div>
    </main>
  );
}
