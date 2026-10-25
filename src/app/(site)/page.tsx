import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import TripCard from "@/components/TripCard";
import LeaderCard from "@/components/LeaderCard";
import ParallaxScene from "@/components/ParallaxScene";
import { SearchDateInput } from "@/components/DateInput";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dict = getDict();
  const locale = getLocale();

  const now = new Date();

  const [trips, leaders, counts] = await Promise.all([
    db.trip.findMany({
      where: {
        status: "published",
        leaderBanned: false,
        endDate: { gte: now },
      },
      include: {
        leader: true,
        bookings: {
          where: { status: { in: ["pending", "approved", "paid"] } },
          select: { seats: true },
        },
      },
      orderBy: { startDate: "asc" },
      take: 6,
    }),
    db.user.findMany({
      where: { role: "leader", isSuspended: false },
      include: {
        trips: {
          where: { status: "published", leaderBanned: false },
          select: { id: true, status: true, endDate: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    Promise.all([
      db.trip.count({ where: { status: "published", leaderBanned: false } }),
      db.user.count({ where: { role: "leader" } }),
      db.user.count({ where: { role: "passenger" } }),
      db.booking.count(),
    ]),
  ]);

  const [tripCount, leaderCount, passengerCount, bookingCount] = counts;

  return (
    <main>
      <ParallaxScene
        brand={dict.brand}
        subtitle={dict.home.heroSub}
        ctaPrimary={{ label: dict.home.ctaExplore, href: "/trips" }}
        ctaSecondary={{ label: dict.home.ctaLeader, href: "/cooperation" }}
        modeDay={dict.home.modeDay}
        modeNight={dict.home.modeNight}
      >
        {/* Search + stats */}
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <form
            action="/trips"
            method="GET"
            className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl p-3 shadow-xl scene-panel sm:flex-row"
          >
            <input
              type="text"
              name="q"
              placeholder={dict.home.searchPh}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
            <SearchDateInput
              name="date"
              locale={locale}
              placeholder={dict.home.searchDate}
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {dict.home.searchBtn}
            </button>
          </form>

          <div className="mt-10 grid grid-cols-2 gap-4 rounded-3xl p-6 scene-panel sm:grid-cols-4">
            {[
              { value: tripCount, label: dict.home.statTrips },
              { value: leaderCount, label: dict.home.statLeaders },
              { value: passengerCount, label: dict.home.statTravelers },
              { value: bookingCount, label: dict.home.statBookings },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold scene-fg">
                  {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(s.value)}
                </div>
                <div className="mt-1 text-xs font-medium scene-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured trips */}
        <section id="featured-trips" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold scene-fg sm:text-3xl">
                {dict.home.featuredTitle}
              </h2>
              <p className="mt-2 scene-muted">{dict.home.featuredSub}</p>
              <p className="mt-3 inline-flex rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-800">
                {dict.trips.freeBooking}
              </p>
            </div>
            <Link
              href="/trips"
              className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
            >
              {dict.common.seeAll} →
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              {dict.common.empty}
            </div>
          ) : (
            <div className="mt-8 -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
              <div className="flex gap-6 snap-x snap-mandatory">
                {trips.map((trip) => (
                  <div key={trip.id} className="min-w-[300px] max-w-[340px] flex-1 shrink-0 snap-start sm:min-w-[340px]">
                    <TripCard
                      trip={{
                        ...trip,
                        seatsUsed: trip.bookings.reduce((s, b) => s + b.seats, 0),
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* How it works */}
        <section id="how" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold scene-fg sm:text-3xl">
                {dict.home.howTitle}
              </h2>
              <p className="mt-3 scene-muted">{dict.home.howSub}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: dict.home.step1Title, d: dict.home.step1Desc, icon: "🧭" },
                { t: dict.home.step2Title, d: dict.home.step2Desc, icon: "📝" },
                { t: dict.home.step3Title, d: dict.home.step3Desc, icon: "✅" },
                { t: dict.home.step4Title, d: dict.home.step4Desc, icon: "💳" },
              ].map((step) => (
                <div
                  key={step.t}
                  className="rounded-2xl p-6 transition scene-panel hover:opacity-90"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                    {step.icon}
                  </div>
                  <h3 className="mt-4 text-base font-bold scene-fg">{step.t}</h3>
                  <p className="mt-2 text-sm leading-7 scene-muted">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaders */}
        <section id="top-leaders" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold scene-fg sm:text-3xl">
                {dict.home.leadersTitle}
              </h2>
              <p className="mt-2 scene-muted">{dict.home.leadersSub}</p>
            </div>
            <Link
              href="/leaders"
              className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
            >
              {dict.common.seeAll} →
            </Link>
          </div>
          <div className="mt-8 -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="flex gap-6 snap-x snap-mandatory">
              {leaders.map((leader) => (
                <div key={leader.id} className="min-w-[280px] max-w-[300px] flex-1 shrink-0 snap-start">
                  <LeaderCard
                    leader={leader}
                    tripCount={leader.trips.length}
                    completedCount={
                      leader.trips.filter((t) => new Date(t.endDate) < now).length
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-brand-700 to-teal-800 px-8 py-14 text-center">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              {dict.home.ctaTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{dict.home.ctaSub}</p>
            <Link
              href="/register"
              className="mt-8 inline-flex rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-800 shadow-xl transition hover:bg-slate-100"
            >
              {dict.home.ctaBtn}
            </Link>
          </div>
        </section>
      </ParallaxScene>
    </main>
  );
}
