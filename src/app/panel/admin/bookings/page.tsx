import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatToman } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import StatusBadge, { bookingStatusTone } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["admin"]);

  const bookings = await db.booking.findMany({
    include: {
      trip: true,
      passenger: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <PanelShell user={user} active="bookings">
      <p className="mb-6 text-sm text-slate-500">{dict.admin.bookingsSub}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.code}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.booking.passenger}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.title}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.seats}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.booking.totalAmount}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.status}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.createdAt}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.code}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{b.passenger.name}</td>
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
                <td className="px-4 py-3 text-xs text-slate-400">
                  {formatDate(b.createdAt, locale)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/panel/bookings/${b.id}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {dict.common.details}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
