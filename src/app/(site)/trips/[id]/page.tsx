import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatDateRange, formatToman, tripDays } from "@/lib/format";
import { requestBookingAction } from "@/lib/actions/bookings";
import Alert from "@/components/Alert";
import { TripImage } from "@/components/TripCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return {};
  const trip = await db.trip.findUnique({ where: { id }, include: { leader: true } });
  if (!trip || trip.leaderBanned) return {};
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://campine.ir").replace(/\/$/, "");
  const title = `${trip.title} — ${trip.destination} | ${trip.leader.name}`;
  const desc = (trip.description || "").slice(0, 155) || `${trip.title} با ${trip.leader.name} در ${trip.destination}`;
  return {
    title,
    description: desc,
    alternates: { canonical: `${base}/trips/${id}` },
    openGraph: {
      title, description: desc, url: `${base}/trips/${id}`, type: "article",
      images: trip.imageUrl ? [{ url: trip.imageUrl, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

const errorMessages: Record<string, "capacity" | "seats" | "unavailable"> = {
  capacity: "capacity",
  seats: "seats",
  unavailable: "unavailable",
};

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await getCurrentUser();

  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      leader: true,
      bookings: {
        where: { status: { in: ["pending", "approved", "paid"] } },
        select: { seats: true },
      },
    },
  });

  if (!trip) notFound();

  const isAdmin = user?.role === "admin";
  const isOwner = user?.id === trip.leaderId;
  const visible =
    (trip.status === "published" && !trip.leaderBanned) || isAdmin || isOwner;
  if (!visible) notFound();

  const seatsUsed = trip.bookings.reduce((s, b) => s + b.seats, 0);
  const seatsLeft = Math.max(0, trip.capacity - seatsUsed);
  const title = locale === "en" && trip.titleEn ? trip.titleEn : trip.title;
  const destination =
    locale === "en" && trip.destinationEn ? trip.destinationEn : trip.destination;
  const description =
    locale === "en" && trip.descriptionEn ? trip.descriptionEn : trip.description;

  const includes = (locale === "en" && trip.includesEn ? trip.includesEn : trip.includes)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const excludes = (locale === "en" && trip.excludesEn ? trip.excludesEn : trip.excludes)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const leaderPublished = await db.trip.count({
    where: { leaderId: trip.leaderId, status: "published", leaderBanned: false },
  });
  const leaderCompleted = await db.trip.count({
    where: { leaderId: trip.leaderId, endDate: { lt: new Date() } },
  });

  const canBook = user?.role === "passenger" && seatsLeft > 0 && trip.status === "published";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://campine.ir").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: title,
    description: description || title,
    image: trip.imageUrl ? [trip.imageUrl] : undefined,
    provider: { "@type": "Person", name: trip.leader.name },
    touristDestination: destination,
    offers: { "@type": "Offer", price: trip.price, priceCurrency: "IRR", availability: seatsLeft > 0 ? "InStock" : "SoldOut", url: `${baseUrl}/trips/${trip.id}` },
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {searchParams.error && errorMessages[searchParams.error] && (
        <Alert tone="error">
          {searchParams.error === "capacity"
            ? dict.validation.maxSeats
            : searchParams.error === "seats"
              ? dict.validation.minSeats
              : dict.common.empty}
        </Alert>
      )}

      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/trips" className="font-semibold text-brand-700 hover:underline">
          {dict.trips.title}
        </Link>
        <span>/</span>
        <span className="text-slate-700">{title}</span>
      </nav>

      {/* Gallery */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-3xl border border-slate-200 lg:col-span-2">
          <div className="h-[320px] sm:h-[420px]">
            <TripImage imageUrl={trip.imageUrl} alt={title} />
          </div>
        </div>

        {/* Booking card */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="text-xs font-semibold text-slate-400">
            {dict.trip.tripCode}: {trip.code}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold leading-snug text-slate-900">
            {title}
          </h1>
          <div className="mt-2 text-sm font-semibold text-brand-700">📍 {destination}</div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">{dict.common.dates}</dt>
              <dd className="font-semibold text-slate-800">
                {formatDateRange(trip.startDate, trip.endDate, locale)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">{dict.common.duration}</dt>
              <dd className="font-semibold text-slate-800">
                {tripDays(trip.startDate, trip.endDate)} {dict.common.days}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">{dict.common.capacity}</dt>
              <dd className="font-semibold text-slate-800">
                {trip.capacity} —{" "}
                <span className={seatsLeft > 0 ? "text-brand-700" : "text-red-600"}>
                  {seatsLeft > 0
                    ? `${seatsLeft} ${dict.trip.left}`
                    : dict.trip.full}
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-2xl bg-brand-50 p-4">
            <div className="text-2xl font-extrabold text-brand-800">
              {formatToman(trip.price, locale)}
            </div>
            <div className="text-xs font-medium text-brand-600">{dict.common.perPerson}</div>
          </div>

          {/* Booking form */}
          <div className="mt-6">
            {!user ? (
              <div className="rounded-2xl border border-slate-200 p-4 text-center">
                <p className="text-sm font-semibold text-slate-700">{dict.trip.mustLogin}</p>
                <p className="mt-1 text-xs text-slate-500">{dict.trip.mustLoginSub}</p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  {dict.trip.loginNow}
                </Link>
              </div>
            ) : user.role !== "passenger" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                {dict.trip.bookSub}
              </div>
            ) : canBook ? (
              <form action={requestBookingAction} className="space-y-3">
                <input type="hidden" name="tripId" value={trip.id} />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    {dict.trip.seatsLabel}
                  </label>
                  <select
                    name="seats"
                    defaultValue="1"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  >
                    {Array.from({ length: Math.min(8, Math.max(1, seatsLeft)) }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    {dict.trip.noteLabel} ({dict.common.optional})
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder={dict.trip.notePh}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  {dict.trip.requestBtn}
                </button>
                <p className="text-[11px] leading-5 text-slate-400">{dict.trip.bookSub}</p>
              </form>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
                {seatsLeft > 0 ? dict.statusHints.trip.cancelled : dict.trip.full}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Description & info */}
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-extrabold text-slate-900">{dict.trip.about}</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600">
              {description || dict.footer.aboutDesc}
            </p>
          </section>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-base font-extrabold text-emerald-800">
                ✓ {dict.trip.includes}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {includes.length > 0 ? (
                  includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">—</li>
                )}
              </ul>
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-base font-extrabold text-red-800">
                ✕ {dict.trip.excludes}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {excludes.length > 0 ? (
                  excludes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">—</li>
                )}
              </ul>
            </section>
          </div>
        </div>

        {/* Leader */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-extrabold text-slate-900">{dict.trip.leaderTitle}</h2>
          <div className="mt-5 flex items-center gap-4">
            {trip.leader.avatarUrl ? (
              <img
                src={trip.leader.avatarUrl}
                alt={trip.leader.name}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-xl font-extrabold text-brand-700">
                {trip.leader.name.slice(0, 1)}
              </span>
            )}
            <div>
              <div className="font-bold text-slate-900">{trip.leader.name}</div>
              <div className="text-xs text-slate-500">{dict.roles.leader}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {(locale === "en" && trip.leader.bioEn ? trip.leader.bioEn : trip.leader.bio) ||
              dict.tagline}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xl font-extrabold text-slate-900">
                {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(leaderPublished)}
              </div>
              <div className="text-[11px] text-slate-500">{dict.leaders.tripsCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xl font-extrabold text-slate-900">
                {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(leaderCompleted)}
              </div>
              <div className="text-[11px] text-slate-500">{dict.leaders.completedCount}</div>
            </div>
          </div>
          <Link
            href={`/leaders/${trip.leaderId}`}
            className="mt-5 block rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-center text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          >
            {dict.leaders.viewProfile}
          </Link>
        </aside>
      </div>
    </main>
  );
}
