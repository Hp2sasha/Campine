import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatToman } from "@/lib/format";
import PanelShell, { StatCard } from "@/components/PanelShell";
import StatusBadge, {
  bookingStatusTone,
  tripStatusTone,
} from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function PanelOverview() {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser();

  let content: React.ReactNode = null;

  if (user.role === "admin") {
    const [users, leaders, trips, published, pending, bookings, paidSum] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { role: "leader" } }),
        db.trip.count(),
        db.trip.count({ where: { status: "published" } }),
        db.trip.count({ where: { status: "pending" } }),
        db.booking.count(),
        db.payment.aggregate({
          where: { status: "paid" },
          _sum: { amount: true },
        }),
      ]);

    content = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={dict.admin.statsUsers} value={users} accent="blue" />
          <StatCard label={dict.admin.statsLeaders} value={leaders} accent="brand" />
          <StatCard label={dict.admin.statsTrips} value={trips} hint={`${published} ${dict.admin.statsPublished}`} accent="violet" />
          <StatCard label={dict.admin.statsBookings} value={bookings} accent="amber" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <StatCard
            label={dict.admin.statsPending}
            value={pending}
            hint={dict.admin.approvalsSub}
            accent="amber"
          />
          <StatCard
            label={dict.admin.statsRevenue}
            value={formatToman(paidSum._sum.amount ?? 0, locale)}
            accent="brand"
          />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/panel/admin/approvals", label: dict.panel.approvals },
            { href: "/panel/admin/trips", label: dict.panel.adminTrips },
            { href: "/panel/admin/bookings", label: dict.panel.adminBookings },
            { href: "/panel/admin/users", label: dict.panel.adminUsers },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-700 shadow-card transition hover:border-brand-300 hover:text-brand-700"
            >
              {l.label} ←
            </Link>
          ))}
        </div>
      </>
    );
  } else if (user.role === "leader") {
    const [myTrips, published, pendingTrips, pendingReqs, completed] =
      await Promise.all([
        db.trip.count({ where: { leaderId: user.id } }),
        db.trip.count({ where: { leaderId: user.id, status: "published" } }),
        db.trip.count({ where: { leaderId: user.id, status: "pending" } }),
        db.booking.count({
          where: {
            trip: { leaderId: user.id },
            status: "pending",
          },
        }),
        db.trip.count({
          where: {
            leaderId: user.id,
            OR: [{ status: "completed" }, { endDate: { lt: new Date() } }],
          },
        }),
      ]);

    const recentRequests = await db.booking.findMany({
      where: { trip: { leaderId: user.id }, status: "pending" },
      include: { trip: true, passenger: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    content = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={dict.panel.myTrips} value={myTrips} hint={`${published} ${dict.leader.publishedCount}`} accent="brand" />
          <StatCard label={dict.leader.pendingCount} value={pendingTrips} accent="amber" />
          <StatCard label={dict.panel.pendingRequests} value={pendingReqs} accent="blue" />
          <StatCard label={dict.panel.completedTrips} value={completed} accent="violet" />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">
              {dict.panel.pendingRequests}
            </h2>
            <Link href="/panel/leader/requests" className="text-xs font-bold text-brand-700 hover:underline">
              {dict.common.seeAll} →
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              {dict.leader.noRequests}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentRequests.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {b.passenger.name} — {b.trip.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {b.code} · {formatDate(b.createdAt, locale)}
                    </div>
                  </div>
                  <StatusBadge
                    label={dict.statuses.booking[b.status as keyof typeof dict.statuses.booking]}
                    tone={bookingStatusTone[b.status] ?? "gray"}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/panel/leader/trips/new", label: dict.panel.newTrip },
            { href: "/panel/leader/trips", label: dict.panel.myTrips },
            { href: "/panel/leader/requests", label: dict.panel.requests },
            { href: "/panel/leader/completed", label: dict.panel.completedTrips },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-700 shadow-card transition hover:border-brand-300 hover:text-brand-700"
            >
              {l.label} ←
            </Link>
          ))}
        </div>
      </>
    );
  } else {
    const [myBookings, paidCount, pendingCount] = await Promise.all([
      db.booking.count({ where: { passengerId: user.id } }),
      db.booking.count({ where: { passengerId: user.id, status: { in: ["paid", "completed"] } } }),
      db.booking.count({ where: { passengerId: user.id, status: "pending" } }),
    ]);

    const recent = await db.booking.findMany({
      where: { passengerId: user.id },
      include: { trip: { include: { leader: true } }, payment: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    content = (
      <>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={dict.panel.myBookings} value={myBookings} accent="brand" />
          <StatCard label={dict.statuses.booking.paid} value={paidCount} accent="blue" />
          <StatCard label={dict.panel.pendingRequests} value={pendingCount} accent="amber" />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">
              {dict.panel.myBookings}
            </h2>
            <Link href="/panel/bookings" className="text-xs font-bold text-brand-700 hover:underline">
              {dict.common.seeAll} →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">{dict.booking.empty}</p>
              <Link
                href="/trips"
                className="mt-4 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                {dict.booking.browseTrips}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{b.trip.title}</div>
                    <div className="text-xs text-slate-400">
                      {b.code} · {formatDate(b.trip.startDate, locale)}
                    </div>
                  </div>
                  <StatusBadge
                    label={dict.statuses.booking[b.status as keyof typeof dict.statuses.booking]}
                    tone={bookingStatusTone[b.status] ?? "gray"}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  }

  return (
    <PanelShell user={user} active="overview">
      <div className="mb-6">
        <p className="text-sm text-slate-500">
          {dict.panel.hello} <b className="text-slate-800">{user.name}</b> 👋
        </p>
      </div>
      {content}
    </PanelShell>
  );
}
