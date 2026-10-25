import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDateRange, formatToman, tripDays } from "@/lib/format";
import StatusBadge, { tripStatusTone } from "./StatusBadge";

type TripForCard = {
  id: number;
  code: string;
  title: string;
  titleEn: string | null;
  destination: string;
  destinationEn: string | null;
  startDate: Date;
  endDate: Date;
  price: number;
  capacity: number;
  imageUrl: string | null;
  status: string;
  leaderBanned: boolean;
  leader: { id: number; name: string; avatarUrl: string | null };
  seatsUsed?: number;
};

export function TripImage({
  imageUrl,
  alt,
  className = "",
}: {
  imageUrl: string | null;
  alt: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`grid h-full w-full place-items-center bg-gradient-to-br from-brand-500 to-teal-700 ${className}`}
    >
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17h18M5 17l2-9h10l2 9M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        <circle cx="12" cy="13" r="2" />
      </svg>
    </div>
  );
}

export default function TripCard({
  trip,
  showStatus = false,
}: {
  trip: TripForCard;
  showStatus?: boolean;
}) {
  const dict = getDict();
  const locale = getLocale();
  const title = locale === "en" && trip.titleEn ? trip.titleEn : trip.title;
  const destination =
    locale === "en" && trip.destinationEn ? trip.destinationEn : trip.destination;
  const seatsUsed =
    trip.seatsUsed ?? 0;
  const seatsLeft = Math.max(0, trip.capacity - seatsUsed);

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-48 overflow-hidden">
        <TripImage
          imageUrl={trip.imageUrl}
          alt={title}
          className="transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 flex items-center gap-2 px-3">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800">
            📍 {destination}
          </span>
          {showStatus && (
            <StatusBadge
              label={dict.statuses.trip[trip.status as keyof typeof dict.statuses.trip]}
              tone={tripStatusTone[trip.status] ?? "gray"}
            />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-brand-700">
          {title}
        </h3>
        <p className="mt-2 text-xs text-slate-500">
          {formatDateRange(trip.startDate, trip.endDate, locale)} · {tripDays(trip.startDate, trip.endDate)} {dict.common.days}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {trip.leader.avatarUrl ? (
            <img src={trip.leader.avatarUrl} alt={trip.leader.name} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-sand-200 text-xs font-bold text-sand-800">
              {trip.leader.name.slice(0, 1)}
            </span>
          )}
          <span className="text-xs font-medium text-slate-600">
            {dict.trips.leaderLabel}: {trip.leader.name}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <div className="text-lg font-extrabold text-brand-700">
              {formatToman(trip.price, locale)}
            </div>
            <div className="text-[11px] text-slate-400">{dict.common.perPerson}</div>
          </div>
          <div className="text-end text-xs">
            {seatsLeft > 0 ? (
              <span className="font-semibold text-slate-600">
                {seatsLeft} {dict.trip.left}
              </span>
            ) : (
              <span className="font-semibold text-red-600">{dict.trip.full}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
