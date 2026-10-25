import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import TripCard from "@/components/TripCard";

export const dynamic = "force-dynamic";

export default async function LeaderProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const dict = getDict();
  const locale = getLocale();
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [leader, ratingRows, reviews] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: {
        trips: {
          where: { status: "published", leaderBanned: false },
          include: {
            leader: true,
            bookings: {
              where: { status: { in: ["pending", "approved", "paid"] } },
              select: { seats: true },
            },
          },
          orderBy: { startDate: "asc" },
        },
      },
    }),
    db.leaderReview.groupBy({
      by: ["leaderId"],
      where: { leaderId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.leaderReview.findMany({
      where: { leaderId: id },
      include: {
        passenger: { select: { name: true } },
        trip: { select: { title: true, titleEn: true, endDate: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!leader || leader.role !== "leader") notFound();

  const now = new Date();
  const upcoming = leader.trips.filter((t) => t.endDate >= now);
  const completedTrips = leader.trips.filter((t) => t.endDate < now);
  const ratingAgg = ratingRows[0];
  const ratingAvg = ratingAgg?._avg.rating ?? 0;
  const ratingCount = ratingAgg?._count.rating ?? 0;
  const rounded = Math.round(ratingAvg * 10) / 10;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="flex flex-wrap items-center gap-6">
          {leader.avatarUrl ? (
            <img
              src={leader.avatarUrl}
              alt={leader.name}
              className="h-24 w-24 rounded-3xl object-cover"
            />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-3xl bg-brand-100 text-3xl font-extrabold text-brand-700">
              {leader.name.slice(0, 1)}
            </span>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900">{leader.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-brand-700">{dict.roles.leader}</span>
              {/* Rating badge */}
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm">
                {ratingCount > 0 ? (
                  <>
                    <span className="text-amber-500">
                      {"★".repeat(Math.round(rounded))}
                      {"☆".repeat(5 - Math.round(rounded))}
                    </span>
                    <span className="font-bold text-slate-800">{rounded.toFixed(1)}</span>
                    <span className="text-xs text-slate-500">
                      ({ratingCount} {dict.leaders.reviewsCount})
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500">{dict.leaders.noRating}</span>
                )}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {(locale === "en" && leader.bioEn ? leader.bioEn : leader.bio) || dict.tagline}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="rounded-2xl bg-slate-50 px-6 py-4">
              <div className="text-2xl font-extrabold text-slate-900">{leader.trips.length}</div>
              <div className="text-xs text-slate-500">{dict.leaders.tripsCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-6 py-4">
              <div className="text-2xl font-extrabold text-slate-900">{completedTrips.length}</div>
              <div className="text-xs text-slate-500">{dict.leaders.completedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming trips */}
      <h2 className="mt-10 text-xl font-extrabold text-slate-900">
        {dict.leaders.upcomingTitle}
      </h2>
      {upcoming.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          {dict.common.empty}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((trip) => (
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

      {/* Completed trips */}
      <h2 className="mt-12 text-xl font-extrabold text-slate-900">
        {dict.leaders.completedTitle}
      </h2>
      {completedTrips.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          {dict.common.empty}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {completedTrips.map((trip) => (
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

      {/* Reviews */}
      <h2 className="mt-12 text-xl font-extrabold text-slate-900">
        {dict.leaders.reviewsTitle}
      </h2>
      {reviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          {dict.leaders.reviewsEmpty}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-700">
                    {r.passenger.name.slice(0, 1)}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{r.passenger.name}</div>
                    <div className="text-xs text-slate-400">
                      {locale === "en" && r.trip.titleEn ? r.trip.titleEn : r.trip.title}
                    </div>
                  </div>
                </div>
                <div className="text-amber-500">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
              </div>
              {r.comment && (
                <p className="mt-3 text-sm leading-7 text-slate-600">{r.comment}</p>
              )}
              <div className="mt-2 text-[11px] text-slate-400">{formatDate(r.createdAt, locale)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/leaders"
          className="text-sm font-semibold text-brand-700 hover:underline"
        >
          ← {dict.leaders.title}
        </Link>
      </div>
    </main>
  );
}
