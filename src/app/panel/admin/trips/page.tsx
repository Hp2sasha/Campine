import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatToman } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge, { tripStatusTone } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["admin"]);

  const trips = await db.trip.findMany({
    include: {
      leader: true,
      bookings: {
        where: { status: { in: ["pending", "approved", "paid"] } },
        select: { seats: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const flashKeys = ["cancelled", "banned", "unbanned", "reassigned", "approved", "rejected", "done"] as const;

  return (
    <PanelShell user={user} active="trips">
      {flashKeys.map(
        (key) =>
          searchParams[key] && (
            <Alert key={key} tone={key === "cancelled" || key === "banned" ? "warning" : "success"}>
              {key === "cancelled"
                ? dict.statusHints.trip.cancelled
                : key === "banned"
                  ? dict.admin.banLeaderHint
                  : dict.common.save}
            </Alert>
          )
      )}
      {searchParams.error && (
        <Alert tone="error">{dict.validation.fillFields}</Alert>
      )}

      <p className="mb-6 text-sm text-slate-500">{dict.admin.allTripsSub}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.title}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.trips.leaderLabel}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.dates}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.price}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.leader.seatsBooked}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.status}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map((trip) => {
              const seatsUsed = trip.bookings.reduce((s, b) => s + b.seats, 0);
              return (
                <tr key={trip.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-800">
                      {locale === "en" && trip.titleEn ? trip.titleEn : trip.title}
                    </div>
                    <div className="text-xs text-slate-400">{trip.code}</div>
                    {trip.leaderBanned && (
                      <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        {dict.admin.leaderBannedBadge}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{trip.leader.name}</td>
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
                      label={dict.statuses.trip[trip.status as keyof typeof dict.statuses.trip]}
                      tone={tripStatusTone[trip.status] ?? "gray"}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/panel/admin/trips/${trip.id}`}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      {dict.admin.tripActions} ←
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
