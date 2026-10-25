import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatToman, tripDays } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import PrintButton from "@/components/PrintButton";
import StatusBadge, { bookingStatusTone } from "@/components/StatusBadge";
import { cancelBookingAction } from "@/lib/actions/bookings";
import { submitLeaderReviewAction } from "@/lib/actions/reviews";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser();

  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      trip: { include: { leader: true } },
      passenger: true,
      payment: true,
    },
  });

  if (!booking) notFound();
  const isOwner = booking.passengerId === user.id;
  const isLeader = booking.trip.leaderId === user.id;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isLeader && !isAdmin) notFound();

  const amount = booking.trip.price * booking.seats;
  const trip = booking.trip;

  const tripEnded = trip.endDate.getTime() < Date.now();
  const canReview =
    isOwner && tripEnded && ["paid", "completed"].includes(booking.status);
  const myReview = isOwner
    ? await db.leaderReview.findUnique({
        where: {
          tripId_passengerId: { tripId: trip.id, passengerId: user.id },
        },
      })
    : null;

  return (
    <PanelShell user={user} active="bookings">
      <div className="mx-auto max-w-3xl">
        {/* Printable booking sheet */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card print-border">
          {/* Print-only header */}
          <div className="print-only mb-6 border-b pb-4 text-center">
            <div className="text-xl font-extrabold">{dict.brand}</div>
            <div className="text-xs text-slate-500">{dict.print.footer}</div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="text-xs font-semibold text-slate-400">
                {dict.booking.invoice} · {dict.common.code}: {booking.code}
              </div>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                {locale === "en" && trip.titleEn ? trip.titleEn : trip.title}
              </h2>
              <div className="mt-1 text-sm text-slate-500">
                📍 {locale === "en" && trip.destinationEn ? trip.destinationEn : trip.destination}
              </div>
            </div>
            <StatusBadge
              label={dict.statuses.booking[booking.status as keyof typeof dict.statuses.booking]}
              tone={bookingStatusTone[booking.status] ?? "gray"}
            />
          </div>

          <div className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <Row k={dict.booking.passenger} v={booking.passenger.name} />
            <Row k={dict.common.email} v={booking.passenger.email ?? "—"} dir="ltr" />
            <Row k={dict.common.phone} v={booking.passenger.phone || "—"} dir="ltr" />
            <Row k={dict.trips.leaderLabel} v={trip.leader.name} />
            <Row
              k={dict.common.dates}
              v={`${formatDate(trip.startDate, locale)} — ${formatDate(trip.endDate, locale)}`}
            />
            <Row
              k={dict.common.duration}
              v={`${tripDays(trip.startDate, trip.endDate)} ${dict.common.days}`}
            />
            <Row k={dict.trip.tripCode} v={trip.code} dir="ltr" />
            <Row k={dict.common.seats} v={String(booking.seats)} />
            <Row k={dict.payment.unitPrice} v={formatToman(trip.price, locale)} />
            <Row k={dict.booking.totalAmount} v={formatToman(amount, locale)} />
            <Row k={dict.common.createdAt} v={formatDateTime(booking.createdAt, locale)} />
            <Row
              k={dict.booking.paidAt}
              v={
                booking.payment?.paidAt
                  ? formatDateTime(booking.payment.paidAt, locale)
                  : dict.booking.notPaid
              }
            />
            {booking.payment?.refId ? (
              <Row k={dict.booking.paymentRef} v={booking.payment.refId} dir="ltr" />
            ) : null}
          </div>

          {booking.note && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="text-xs font-semibold text-slate-400">{dict.trip.noteLabel}</div>
              <p className="mt-1 text-slate-600">{booking.note}</p>
            </div>
          )}

          {booking.leaderNote && (
            <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm">
              <div className="text-xs font-semibold text-amber-600">
                {dict.leader.rejectReason || dict.common.note}
              </div>
              <p className="mt-1 text-amber-800">{booking.leaderNote}</p>
            </div>
          )}

          <div className="signature-line print-signature">
            <div className="text-xs text-slate-400">{dict.print.signatureLabel}</div>
            <div className="text-xs text-slate-400">
              {dict.brand} — {dict.print.generatedAt}: {formatDateTime(new Date(), locale)}
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-slate-300">
            {dict.print.officialNote}
          </p>
        </div>

        {/* Leader review (survey) */}
        {isOwner && tripEnded && ["paid", "completed"].includes(booking.status) && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-extrabold text-slate-900">{dict.review.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{dict.review.sub}</p>

            {searchParams.reviewed && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {dict.review.done}
              </div>
            )}

            {myReview ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">{dict.review.yourRating}</div>
                <div className="mt-1 text-xl text-amber-500">
                  {"★".repeat(myReview.rating)}
                  {"☆".repeat(5 - myReview.rating)}
                  <span className="ms-2 text-sm font-bold text-slate-700">
                    {myReview.rating}/5
                  </span>
                </div>
                {myReview.comment && (
                  <p className="mt-2 text-sm leading-7 text-slate-600">{myReview.comment}</p>
                )}
              </div>
            ) : canReview ? (
              <form action={submitLeaderReviewAction} className="mt-4 space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-600">
                    {dict.review.ratingLabel}
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end gap-1">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <label key={n} className="cursor-pointer text-3xl leading-none">
                        <input
                          type="radio"
                          name="rating"
                          value={n}
                          defaultChecked={n === 5}
                          className="peer sr-only"
                        />
                        <span className="text-slate-300 transition peer-checked:text-amber-400 hover:text-amber-300">
                          ★
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    {dict.review.commentLabel}
                  </label>
                  <textarea
                    name="comment"
                    rows={3}
                    placeholder={dict.review.commentPh}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  {dict.review.submit}
                </button>
              </form>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/panel/bookings"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            ← {dict.common.back}
          </Link>
          <div className="flex flex-wrap gap-2">
            {booking.status === "approved" && isOwner && (
              <form action="/api/payment/initiate" method="POST">
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  💳 {dict.booking.payNow}
                </button>
              </form>
            )}
            {["pending", "approved"].includes(booking.status) &&
              (isOwner || isLeader || isAdmin) && (
                <form action={cancelBookingAction}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="back" value={`/panel/bookings/${booking.id}`} />
                  <button
                    type="submit"
                    className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    {dict.common.cancel}
                  </button>
                </form>
              )}
            <PrintButton label={dict.booking.printInvoice} />
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function Row({ k, v, dir }: { k: string; v: string; dir?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-slate-100 pb-2">
      <span className="text-slate-400">{k}</span>
      <span className={`text-end font-bold text-slate-800 ${dir === "ltr" ? "font-mono text-xs" : ""}`} dir={dir}>
        {v}
      </span>
    </div>
  );
}
