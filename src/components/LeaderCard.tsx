import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";

export default function LeaderCard({
  leader,
  tripCount = 0,
  completedCount = 0,
  ratingAvg = null,
  ratingCount = 0,
}: {
  leader: {
    id: number;
    name: string;
    bio: string | null;
    bioEn: string | null;
    avatarUrl: string | null;
  };
  tripCount?: number;
  completedCount?: number;
  ratingAvg?: number | null;
  ratingCount?: number;
}) {
  const dict = getDict();
  const locale = getLocale();
  const bio = locale === "en" && leader.bioEn ? leader.bioEn : leader.bio;
  const rounded = ratingAvg ? Math.round(ratingAvg * 10) / 10 : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Large cover image — like TripCard */}
      <Link href={`/leaders/${leader.id}`} className="relative block h-56 overflow-hidden sm:h-60">
        {leader.avatarUrl ? (
          <img
            src={leader.avatarUrl}
            alt={leader.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-500 to-teal-700">
            <span className="text-5xl font-extrabold text-white/90">{leader.name.slice(0, 1)}</span>
          </div>
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Name + rating on image */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <h3 className="text-lg font-extrabold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] line-clamp-1">
            {leader.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {ratingCount > 0 ? (
              <>
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-amber-600 shadow-sm">
                  ★ {rounded.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-white/90 drop-shadow">
                  ({ratingCount} {dict.leaders.reviewsCount})
                </span>
              </>
            ) : (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {dict.leaders.noRating}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content below image */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-6 text-slate-500">
          {bio || dict.tagline}
        </p>

        <div className="mt-4 flex items-center justify-center gap-6 rounded-xl bg-slate-50 py-3 text-sm">
          <div className="text-center">
            <div className="text-lg font-extrabold text-slate-900">{tripCount}</div>
            <div className="text-xs text-slate-500">{dict.leaders.tripsCount}</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <div className="text-lg font-extrabold text-slate-900">{completedCount}</div>
            <div className="text-xs text-slate-500">{dict.leaders.completedCount}</div>
          </div>
        </div>

        <Link
          href={`/leaders/${leader.id}`}
          className="mt-4 w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-center text-sm font-bold text-brand-700 transition hover:bg-brand-100"
        >
          {dict.leaders.viewProfile}
        </Link>
      </div>
    </div>
  );
}
