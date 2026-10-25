import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatToman } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge, { bookingStatusTone } from "@/components/StatusBadge";
import { cancelBookingAction } from "@/lib/actions/bookings";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: { success?: string; code?: string; error?: string; cancelled?: string };
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser();

  const bookings = await db.booking.findMany({
    where: { passengerId: user.id },
    include: {
      trip: { include: { leader: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PanelShell user={user} active="bookings">
      {searchParams.success && (
        <Alert tone="success">
          <b>{dict.booking.requestSuccess}</b> — {dict.booking.requestSuccessSub}
          {searchParams.code ? ` (${dict.common.code}: ${searchParams.code})` : ""}
        </Alert>
      )}
      {searchParams.cancelled && (
        <Alert tone="info">{dict.booking.cancelDone}</Alert>
      )}
      {searchParams.error && (
        <Alert tone="error">{dict.validation.fillFields}</Alert>
      )}

      <p className="mb-6 text-sm text-slate-500">{dict.booking.myBookingsSub}</p>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="text-5xl">🎒</div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">{dict.booking.empty}</h2>
          <p className="mt-2 text-sm text-slate-500">{dict.booking.emptySub}</p>
          <Link
            href="/trips"
            className="mt-6 inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white"
          >
            {dict.booking.browseTrips}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const amount = b.trip.price * b.seats;
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {b.trip.imageUrl ? (
                        <img
                          src={b.trip.imageUrl}
                          alt={b.trip.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-2xl">🏔️</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/trips/${b.tripId}`}
                        className="line-clamp-1 text-base font-bold text-slate-900 hover:text-brand-700"
                      >
                        {locale === "en" && b.trip.titleEn ? b.trip.titleEn : b.trip.title}
                      </Link>
                      <div className="mt-1 text-xs text-slate-500">
                        {dict.common.code}: <b>{b.code}</b> · {dict.trips.leaderLabel}:{" "}
                        {b.trip.leader.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDate(b.trip.startDate, locale)} — {formatDate(b.trip.endDate, locale)} ·{" "}
                        {dict.common.seats}: {b.seats}
                      </div>
                      <div className="mt-1 text-sm font-bold text-brand-700">
                        {formatToman(amount, locale)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge
                      label={
                        dict.statuses.booking[b.status as keyof typeof dict.statuses.booking]
                      }
                      tone={bookingStatusTone[b.status] ?? "gray"}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/panel/bookings/${b.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        {dict.common.details}
                      </Link>
                      {b.status === "approved" && (
                        <form action="/api/payment/initiate" method="POST">
                          <input type="hidden" name="bookingId" value={b.id} />
                          <button
                            type="submit"
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
                          >
                            💳 {dict.booking.payNow}
                          </button>
                        </form>
                      )}
                      {["pending", "approved"].includes(b.status) && (
                        <form action={cancelBookingAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="back" value="/panel/bookings" />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                          >
                            {dict.common.cancel}
                          </button>
                        </form>
                      )}
                      {["paid", "completed"].includes(b.status) && (
                        <Link
                          href={`/panel/bookings/${b.id}`}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
                        >
                          🖨 {dict.booking.invoice}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                  {dict.statusHints.booking[b.status as keyof typeof dict.statusHints.booking]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}
