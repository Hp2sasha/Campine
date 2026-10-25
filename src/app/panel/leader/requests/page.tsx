import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatToman } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge, { bookingStatusTone } from "@/components/StatusBadge";
import {
  approveBookingAction,
  rejectBookingAction,
  cancelBookingAction,
} from "@/lib/actions/bookings";

export const dynamic = "force-dynamic";

export default async function LeaderRequestsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["leader", "admin"]);

  const bookings = await db.booking.findMany({
    where: {
      trip: { leaderId: user.id },
    },
    include: {
      trip: true,
      passenger: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = bookings.filter((b) => b.status === "pending");
  const others = bookings.filter((b) => b.status !== "pending");

  return (
    <PanelShell user={user} active="requests">
      {searchParams.approved && (
        <Alert tone="success">{dict.statusHints.booking.approved}</Alert>
      )}
      {searchParams.rejected && (
        <Alert tone="warning">{dict.statusHints.booking.rejected}</Alert>
      )}
      {searchParams.error && (
        <Alert tone="error">{dict.validation.fillFields}</Alert>
      )}

      <p className="mb-6 text-sm text-slate-500">{dict.leader.requestsSub}</p>

      {/* Pending requests */}
      <h2 className="mb-4 text-sm font-extrabold text-slate-900">
        {dict.panel.pendingRequests} ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          {dict.leader.noRequests}
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {b.passenger.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {b.code} · {formatDateTime(b.createdAt, locale)}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {dict.common.title}:{" "}
                    <Link href={`/trips/${b.tripId}`} className="font-bold text-brand-700 hover:underline">
                      {locale === "en" && b.trip.titleEn ? b.trip.titleEn : b.trip.title}
                    </Link>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {dict.common.seats}: <b>{b.seats}</b> · {dict.booking.totalAmount}:{" "}
                    <b>{formatToman(b.trip.price * b.seats, locale)}</b>
                  </div>
                  {b.note && (
                    <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-500">
                      💬 {b.note}
                    </div>
                  )}
                </div>
                <StatusBadge
                  label={dict.statuses.booking[b.status as keyof typeof dict.statuses.booking]}
                  tone={bookingStatusTone[b.status] ?? "gray"}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-3">
                <form action={approveBookingAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="back" value="/panel/leader/requests" />
                  <button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">
                    ✓ {dict.leader.approveBooking}
                  </button>
                </form>

                <details className="rounded-xl border border-red-200 bg-white">
                  <summary className="cursor-pointer list-none rounded-xl px-5 py-2.5 text-sm font-bold text-red-600">
                    ✕ {dict.leader.rejectBooking}
                  </summary>
                  <div className="p-4">
                    <form action={rejectBookingAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="back" value="/panel/leader/requests" />
                      <textarea
                        name="leaderNote"
                        rows={2}
                        placeholder={dict.leader.rejectReason}
                        className="w-72 max-w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300"
                      />
                      <button className="mt-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white">
                        {dict.leader.rejectBooking}
                      </button>
                    </form>
                  </div>
                </details>

                <Link
                  href={`/panel/bookings/${b.id}`}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  {dict.common.details}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <h2 className="mb-4 mt-10 text-sm font-extrabold text-slate-900">
        {dict.common.status} ({others.length})
      </h2>
      {others.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          {dict.common.empty}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{dict.booking.passenger}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.title}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.seats}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.booking.totalAmount}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.status}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {others.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{b.passenger.name}</div>
                    <div className="text-xs text-slate-400">{b.code}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {locale === "en" && b.trip.titleEn ? b.trip.titleEn : b.trip.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.seats}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {formatToman(b.trip.price * b.seats, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={dict.statuses.booking[b.status as keyof typeof dict.statuses.booking]}
                      tone={bookingStatusTone[b.status] ?? "gray"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href={`/panel/bookings/${b.id}`}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        {dict.common.details}
                      </Link>
                      {["pending", "approved"].includes(b.status) && (
                        <form action={cancelBookingAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="back" value="/panel/leader/requests" />
                          <button className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                            {dict.common.cancel}
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelShell>
  );
}
