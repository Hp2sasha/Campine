import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatToman } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge, { tripStatusTone } from "@/components/StatusBadge";
import { completeTripAction } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

export default async function LeaderCompletedPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["leader", "admin"]);
  const now = new Date();

  const trips = await db.trip.findMany({
    where: {
      leaderId: user.id,
      OR: [
        { status: "completed" },
        { status: "published", endDate: { lt: now } },
        { status: "cancelled", endDate: { lt: now } },
      ],
    },
    include: {
      bookings: {
        where: { status: { in: ["paid", "completed"] } },
        select: { seats: true, status: true },
      },
    },
    orderBy: { endDate: "desc" },
  });

  return (
    <PanelShell user={user} active="completed">
      {searchParams.done && (
        <Alert tone="success">{dict.statusHints.booking.completed}</Alert>
      )}

      <div className="mb-6">
        <p className="text-sm text-slate-500">{dict.leader.completedSub}</p>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="text-5xl">🏆</div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">
            {dict.leader.completedEmpty}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{dict.leader.completedEmptySub}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {trips.map((trip) => {
            const travelers = trip.bookings.reduce((s, b) => s + b.seats, 0);
            return (
              <div
                key={trip.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {locale === "en" && trip.titleEn ? trip.titleEn : trip.title}
                    </h3>
                    <div className="mt-1 text-xs text-slate-400">
                      {trip.code} · 📍{" "}
                      {locale === "en" && trip.destinationEn ? trip.destinationEn : trip.destination}
                    </div>
                  </div>
                  <StatusBadge
                    label={dict.statuses.trip[trip.status as keyof typeof dict.statuses.trip]}
                    tone={tripStatusTone[trip.status] ?? "gray"}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-lg font-extrabold text-slate-900">{travelers}</div>
                    <div className="text-[10px] text-slate-500">{dict.common.seats}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-lg font-extrabold text-slate-900">
                      {formatToman(trip.price, locale)}
                    </div>
                    <div className="text-[10px] text-slate-500">{dict.common.perPerson}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-bold text-slate-700">
                      {formatDate(trip.endDate, locale)}
                    </div>
                    <div className="text-[10px] text-slate-500">{dict.common.dates}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {dict.common.details}
                  </Link>
                  {trip.status === "published" && (
                    <form action={completeTripAction}>
                      <input type="hidden" name="id" value={trip.id} />
                      <input type="hidden" name="back" value="/panel/leader/completed" />
                      <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700">
                        ✓ {dict.leader.markCompleted}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}
