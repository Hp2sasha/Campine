import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatToman, isPast } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge, { tripStatusTone } from "@/components/StatusBadge";
import {
  publishTripAction,
  submitTripAction,
  completeTripAction,
} from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

const successCodes: Record<string, string> = {
  created: "created",
  updated: "updated",
  submitted: "submitted",
  published: "published",
};

export default async function LeaderTripsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["leader", "admin"]);

  const trips = await db.trip.findMany({
    where: { leaderId: user.id },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: { in: ["pending", "approved", "paid"] } },
        select: { seats: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const upcomingTrips = trips.filter((t) => t.endDate >= now && t.status !== "completed");
  const completedTrips = trips.filter((t) => t.endDate < now || t.status === "completed");

  function renderTable(list: typeof trips) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.title}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.dates}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.price}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.leader.seatsBooked}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.status}</th>
                <th className="px-4 py-3 text-start font-semibold">{dict.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((trip) => {
                const seatsUsed = trip.bookings.reduce((s, b) => s + b.seats, 0);
                return (
                  <tr key={trip.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800">
                        {locale === "en" && trip.titleEn ? trip.titleEn : trip.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {trip.code} · 📍{" "}
                        {locale === "en" && trip.destinationEn ? trip.destinationEn : trip.destination}
                      </div>
                      {trip.leaderBanned && (
                        <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          {dict.admin.leaderBannedBadge}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {formatDate(trip.startDate, locale)}
                      <br />
                      {formatDate(trip.endDate, locale)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {formatToman(trip.price, locale)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {seatsUsed}/{trip.capacity}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        label={
                          dict.statuses.trip[trip.status as keyof typeof dict.statuses.trip]
                        }
                        tone={tripStatusTone[trip.status] ?? "gray"}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          {dict.common.view}
                        </Link>
                        {!["cancelled", "completed", "published"].includes(trip.status) && (
                          <Link
                            href={`/panel/leader/trips/${trip.id}/edit`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            {dict.common.edit}
                          </Link>
                        )}
                        {["draft", "rejected"].includes(trip.status) && !trip.leaderBanned && (
                          <form action={submitTripAction}>
                            <input type="hidden" name="id" value={trip.id} />
                            <button className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
                              {trip.status === "rejected" ? dict.leader.resubmit : dict.leader.submitApproval}
                            </button>
                          </form>
                        )}
                        {trip.status === "approved" && !trip.leaderBanned && (
                          <form action={publishTripAction}>
                            <input type="hidden" name="id" value={trip.id} />
                            <button className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700">
                              🚀 {dict.leader.publish}
                            </button>
                          </form>
                        )}
                        {trip.status === "published" && isPast(trip.endDate) && (
                          <form action={completeTripAction}>
                            <input type="hidden" name="id" value={trip.id} />
                            <input type="hidden" name="back" value="/panel/leader/trips" />
                            <button className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-violet-700">
                              ✓ {dict.leader.markCompleted}
                            </button>
                          </form>
                        )}
                      </div>
                      <div className="mt-1.5 max-w-[220px] text-[10px] leading-4 text-slate-400">
                        {dict.statusHints.trip[trip.status as keyof typeof dict.statusHints.trip]}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    );
  }

  return (
    <PanelShell user={user} active="trips">
      {searchParams.error && (
        <Alert tone="error">{dict.validation.fillFields}</Alert>
      )}
      {Object.keys(successCodes).map(
        (key) =>
          searchParams[key] && (
            <Alert key={key} tone="success">
              {key === "published"
                ? dict.statusHints.trip.published
                : key === "submitted"
                  ? dict.statusHints.trip.pending
                  : dict.common.save}
            </Alert>
          )
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{dict.leader.tripsSub}</p>
        <Link
          href="/panel/leader/trips/new"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
        >
          + {dict.panel.newTrip}
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="text-5xl">🧭</div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">{dict.leader.noTrips}</h2>
          <Link
            href="/panel/leader/trips/new"
            className="mt-6 inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white"
          >
            {dict.panel.newTrip}
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">
            {dict.leaders.upcomingTitle}
          </h2>
          {upcomingTrips.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              {dict.common.empty}
            </p>
          ) : (
            renderTable(upcomingTrips)
          )}

          {/* Completed */}
          <h2 className="mb-3 mt-10 text-lg font-extrabold text-slate-900">
            {dict.leaders.completedTitle}
          </h2>
          {completedTrips.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              {dict.panel.completedEmpty}
            </p>
          ) : (
            renderTable(completedTrips)
          )}
        </>
      )}
    </PanelShell>
  );
}
