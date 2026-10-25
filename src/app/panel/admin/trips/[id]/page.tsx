import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatToman, tripDays } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge, {
  bookingStatusTone,
  tripStatusTone,
} from "@/components/StatusBadge";
import {
  approveTripAction,
  rejectTripAction,
  cancelTripAction,
  banLeaderFromTripAction,
  unbanLeaderFromTripAction,
  reassignLeaderAction,
  setSuspendedAction,
} from "@/lib/actions/admin";
import { completeTripAction } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

export default async function AdminTripDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["admin"]);

  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      leader: true,
      bookings: {
        include: { passenger: true, payment: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!trip) notFound();

  const leaders = await db.user.findMany({
    where: { role: "leader", isSuspended: false, id: { not: trip.leaderId } },
    orderBy: { name: "asc" },
  });

  const seatsUsed = trip.bookings
    .filter((b) => ["pending", "approved", "paid"].includes(b.status))
    .reduce((s, b) => s + b.seats, 0);

  const back = `/panel/admin/trips/${trip.id}`;

  return (
    <PanelShell user={user} active="trips">
      {["cancelled", "banned", "unbanned", "reassigned", "approved", "rejected", "done"].map(
        (key) =>
          searchParams[key] && (
            <Alert key={key} tone={key === "cancelled" || key === "banned" ? "warning" : "success"}>
              {dict.common.save}: {key}
            </Alert>
          )
      )}
      {searchParams.error && (
        <Alert tone="error">{dict.validation.fillFields}</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trip info */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {locale === "en" && trip.titleEn ? trip.titleEn : trip.title}
                </h2>
                <div className="mt-1 text-sm text-slate-500">
                  {trip.code} · 📍{" "}
                  {locale === "en" && trip.destinationEn ? trip.destinationEn : trip.destination}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={dict.statuses.trip[trip.status as keyof typeof dict.statuses.trip]}
                  tone={tripStatusTone[trip.status] ?? "gray"}
                />
                {trip.leaderBanned && (
                  <StatusBadge label={dict.admin.leaderBannedBadge} tone="red" />
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Item k={dict.common.dates} v={`${formatDate(trip.startDate, locale)} — ${formatDate(trip.endDate, locale)}`} />
              <Item k={dict.common.duration} v={`${tripDays(trip.startDate, trip.endDate)} ${dict.common.days}`} />
              <Item k={dict.common.price} v={formatToman(trip.price, locale)} />
              <Item k={dict.common.capacity} v={`${seatsUsed} / ${trip.capacity}`} />
              <Item k={dict.common.createdAt} v={formatDateTime(trip.createdAt, locale)} />
              <Item k={dict.trips.leaderLabel} v={trip.leader.name} />
            </div>

            {trip.description && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-400">{dict.common.description}</div>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {trip.description}
                </p>
              </div>
            )}

            {trip.adminNote && (
              <div className="mt-3 rounded-2xl bg-amber-50 p-4">
                <div className="text-xs font-semibold text-amber-600">{dict.admin.adminNote}</div>
                <p className="mt-1 text-sm text-amber-800">{trip.adminNote}</p>
              </div>
            )}

            <div className="mt-5">
              <Link
                href={`/trips/${trip.id}`}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                {dict.admin.seeTrip} ←
              </Link>
            </div>
          </div>

          {/* Bookings */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-sm font-extrabold text-slate-900">
              {dict.panel.adminBookings} ({trip.bookings.length})
            </h3>
            {trip.bookings.length === 0 ? (
              <p className="mt-4 text-center text-sm text-slate-400">{dict.common.empty}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-400">
                    <tr>
                      <th className="pb-2 text-start font-semibold">{dict.booking.passenger}</th>
                      <th className="pb-2 text-start font-semibold">{dict.common.seats}</th>
                      <th className="pb-2 text-start font-semibold">{dict.booking.totalAmount}</th>
                      <th className="pb-2 text-start font-semibold">{dict.common.status}</th>
                      <th className="pb-2 text-start font-semibold">{dict.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trip.bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-800">{b.passenger.name}</div>
                          <div className="text-xs text-slate-400">{b.code}</div>
                        </td>
                        <td className="py-2.5">{b.seats}</td>
                        <td className="py-2.5 font-semibold">
                          {formatToman(trip.price * b.seats, locale)}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge
                            label={
                              dict.statuses.booking[b.status as keyof typeof dict.statuses.booking]
                            }
                            tone={bookingStatusTone[b.status] ?? "gray"}
                          />
                        </td>
                        <td className="py-2.5">
                          <Link
                            href={`/panel/bookings/${b.id}`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            {dict.common.details}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Admin actions */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-sm font-extrabold text-slate-900">{dict.admin.tripActions}</h3>

            {trip.status === "pending" && (
              <div className="mt-4 space-y-2">
                <form action={approveTripAction}>
                  <input type="hidden" name="id" value={trip.id} />
                  <input type="hidden" name="back" value={back} />
                  <button className="w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">
                    ✓ {dict.admin.approve}
                  </button>
                </form>
                <form action={rejectTripAction}>
                  <input type="hidden" name="id" value={trip.id} />
                  <input type="hidden" name="back" value={back} />
                  <textarea
                    name="adminNote"
                    rows={2}
                    placeholder={dict.admin.adminNote}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                  <button className="mt-2 w-full rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100">
                    ✕ {dict.admin.reject}
                  </button>
                </form>
              </div>
            )}

            {["published", "approved", "pending", "draft", "rejected"].includes(trip.status) && (
              <form action={cancelTripAction} className="mt-4">
                <input type="hidden" name="id" value={trip.id} />
                <input type="hidden" name="back" value={back} />
                <textarea
                  name="adminNote"
                  rows={2}
                  placeholder={dict.admin.cancelTripReason}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
                <button
                  className="mt-2 w-full rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                  onClick={undefined}
                >
                  ⛔ {dict.admin.cancelTrip}
                </button>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  {dict.admin.confirmCancel}
                </p>
              </form>
            )}

            {["published", "approved"].includes(trip.status) && (
              <form action={completeTripAction} className="mt-3">
                <input type="hidden" name="id" value={trip.id} />
                <input type="hidden" name="back" value={back} />
                <button className="w-full rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100">
                  ✓ {dict.leader.markCompleted}
                </button>
              </form>
            )}
          </div>

          {/* Leader management */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-sm font-extrabold text-slate-900">{dict.trips.leaderLabel}</h3>
            <div className="mt-3 flex items-center gap-3">
              {trip.leader.avatarUrl ? (
                <img src={trip.leader.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                  {trip.leader.name.slice(0, 1)}
                </span>
              )}
              <div>
                <div className="text-sm font-bold text-slate-800">{trip.leader.name}</div>
                <div className="text-xs text-slate-400" dir="ltr">
                  {trip.leader.email}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {!trip.leaderBanned ? (
                <form action={banLeaderFromTripAction}>
                  <input type="hidden" name="id" value={trip.id} />
                  <input type="hidden" name="back" value={back} />
                  <button className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100">
                    🚫 {dict.admin.banLeader}
                  </button>
                </form>
              ) : (
                <form action={unbanLeaderFromTripAction}>
                  <input type="hidden" name="id" value={trip.id} />
                  <input type="hidden" name="back" value={back} />
                  <button className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
                    ✓ {dict.admin.unbanLeader}
                  </button>
                </form>
              )}
              <p className="text-[11px] leading-5 text-slate-400">{dict.admin.banLeaderHint}</p>

              {!trip.leader.isSuspended && (
                <form action={setSuspendedAction}>
                  <input type="hidden" name="id" value={trip.leaderId} />
                  <input type="hidden" name="suspended" value="1" />
                  <input type="hidden" name="back" value={back} />
                  <button className="w-full rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100">
                    ⏸ {dict.admin.suspend}
                  </button>
                </form>
              )}

              <form action={reassignLeaderAction}>
                <input type="hidden" name="id" value={trip.id} />
                <input type="hidden" name="back" value={back} />
                <label className="mb-1.5 mt-3 block text-xs font-semibold text-slate-500">
                  {dict.admin.reassignLeader}
                </label>
                <select
                  name="leaderId"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                >
                  <option value="">— {dict.admin.newLeader} —</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <button className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100">
                  {dict.common.confirm}
                </button>
              </form>
            </div>
          </div>
        </aside>
      </div>
    </PanelShell>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-slate-100 pb-2">
      <span className="text-slate-400">{k}</span>
      <span className="text-end font-bold text-slate-800">{v}</span>
    </div>
  );
}
