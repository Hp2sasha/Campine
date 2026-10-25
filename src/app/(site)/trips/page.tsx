import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import TripCard from "@/components/TripCard";
import { SearchDateInput } from "@/components/DateInput";
import { normalizeToGregorian, jalaliToGregorianStr, toEnglishDigits } from "@/lib/jalali";

export const dynamic = "force-dynamic";

function resolveDateFilter(dateRaw: string) {
  const date = toEnglishDigits(dateRaw.trim());
  if (!date) return {};
  // Accept both  YYYY-MM-DD (gregorian or jalali) and YYYY/MM/DD
  // Year 1300-1500 => treat as Jalali, else Gregorian
  let gregorianISO: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const y = Number(date.slice(0, 4));
    if (y >= 1300 && y <= 1500) gregorianISO = jalaliToGregorianStr(date);
    else gregorianISO = date;
  } else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(date)) {
    gregorianISO = jalaliToGregorianStr(date.replace(/\//g, "-"));
  } else {
    gregorianISO = normalizeToGregorian(date);
  }
  if (!gregorianISO || !/^\d{4}-\d{2}-\d{2}$/.test(gregorianISO)) return {};
  return {
    startDate: { lte: new Date(gregorianISO + "T23:59:59") },
    endDate: { gte: new Date(gregorianISO + "T00:00:00") },
  };
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: { q?: string; date?: string; sort?: string };
}) {
  const dict = getDict();
  const locale = getLocale();
  const q = (searchParams.q ?? "").trim();
  const date = (searchParams.date ?? "").trim();
  const sort = searchParams.sort ?? "latest";

  const orderBy =
    sort === "cheapest"
      ? { price: "asc" as const }
      : sort === "soonest"
        ? { startDate: "asc" as const }
        : { createdAt: "desc" as const };

  const dateFilter = resolveDateFilter(date);

  const trips = await db.trip.findMany({
    where: {
      status: "published",
      leaderBanned: false,
      endDate: { gte: new Date() },
      ...dateFilter,
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { titleEn: { contains: q } },
              { destination: { contains: q } },
              { destinationEn: { contains: q } },
              { leader: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      leader: true,
      bookings: {
        where: { status: { in: ["pending", "approved", "paid"] } },
        select: { seats: true },
      },
    },
    orderBy,
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{dict.trips.title}</h1>
          <p className="mt-2 text-slate-500">{dict.trips.sub}</p>
          <p className="mt-3 inline-flex rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-800">
            {dict.trips.freeBooking}
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-500">
          {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(trips.length)} {dict.trips.results}
        </div>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
      >
        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            {dict.trips.search}
          </label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={dict.trips.destinationPh}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            {dict.trips.dateLabel}
          </label>
          <SearchDateInput name="date" defaultValue={date} locale={locale} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            {dict.trips.sort}
          </label>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="latest">{dict.trips.sortLatest}</option>
            <option value="cheapest">{dict.trips.sortCheapest}</option>
            <option value="soonest">{dict.trips.sortSoonest}</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {dict.common.search}
        </button>
        {(q || date || sort !== "latest") && (
          <Link
            href="/trips"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {dict.trips.clear}
          </Link>
        )}
      </form>

      {trips.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="text-5xl">🧭</div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">{dict.common.empty}</h2>
          <p className="mt-2 text-sm text-slate-500">{dict.trips.emptySub}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={{
                ...trip,
                seatsUsed: trip.bookings.reduce((s, b) => s + b.seats, 0),
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
