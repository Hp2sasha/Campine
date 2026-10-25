import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatToman } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge, { tripStatusTone } from "@/components/StatusBadge";
import { approveTripAction, rejectTripAction } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["admin"]);

  const trips = await db.trip.findMany({
    where: { status: "pending" },
    include: {
      leader: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <PanelShell user={user} active="approvals">
      {searchParams.approved && (
        <Alert tone="success">{dict.statusHints.trip.approved}</Alert>
      )}
      {searchParams.rejected && (
        <Alert tone="warning">{dict.statusHints.trip.rejected}</Alert>
      )}
      {searchParams.error && (
        <Alert tone="error">{dict.validation.fillFields}</Alert>
      )}

      <p className="mb-6 text-sm text-slate-500">{dict.admin.approvalsSub}</p>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="text-5xl">✅</div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">{dict.admin.noPending}</h2>
          <p className="mt-2 text-sm text-slate-500">{dict.admin.noPendingSub}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl border border-amber-200 bg-white p-6 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {locale === "en" && trip.titleEn ? trip.titleEn : trip.title}
                    </h3>
                    <StatusBadge
                      label={dict.statuses.trip[trip.status as keyof typeof dict.statuses.trip]}
                      tone={tripStatusTone[trip.status] ?? "gray"}
                    />
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <div>
                      {trip.code} · 📍{" "}
                      {locale === "en" && trip.destinationEn ? trip.destinationEn : trip.destination}
                    </div>
                    <div>
                      {dict.common.dates}: {formatDate(trip.startDate, locale)} —{" "}
                      {formatDate(trip.endDate, locale)}
                    </div>
                    <div>
                      {dict.common.price}: <b>{formatToman(trip.price, locale)}</b> ·{" "}
                      {dict.common.capacity}: <b>{trip.capacity}</b>
                    </div>
                    <div>
                      {dict.trips.leaderLabel}:{" "}
                      <Link
                        href={`/leaders/${trip.leaderId}`}
                        className="font-bold text-brand-700 hover:underline"
                      >
                        {trip.leader.name}
                      </Link>
                    </div>
                  </div>
                  {trip.description && (
                    <p className="mt-3 max-w-2xl rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
                      {trip.description.slice(0, 300)}
                      {trip.description.length > 300 ? "..." : ""}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    {dict.admin.seeTrip}
                  </Link>

                  <form action={approveTripAction} className="flex flex-col gap-2">
                    <input type="hidden" name="id" value={trip.id} />
                    <input type="hidden" name="back" value="/panel/admin/approvals" />
                    <button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">
                      ✓ {dict.admin.approve}
                    </button>
                  </form>

                  <details className="rounded-xl border border-red-200">
                    <summary className="cursor-pointer list-none rounded-xl px-5 py-2.5 text-center text-sm font-bold text-red-600">
                      ✕ {dict.admin.reject}
                    </summary>
                    <div className="p-3">
                      <form action={rejectTripAction}>
                        <input type="hidden" name="id" value={trip.id} />
                        <input type="hidden" name="back" value="/panel/admin/approvals" />
                        <textarea
                          name="adminNote"
                          rows={2}
                          placeholder={dict.admin.adminNote}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300"
                        />
                        <button className="mt-2 w-full rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white">
                          {dict.admin.reject}
                        </button>
                      </form>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
