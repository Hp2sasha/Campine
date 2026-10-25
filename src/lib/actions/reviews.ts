"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sanitizeText, assertOrigin } from "@/lib/sanitize";

/** Passenger submits a 1-5 rating + optional comment for the trip's leader. */
export async function submitLeaderReviewAction(formData: FormData) {
  assertOrigin();
  const user = await requireUser();
  const bookingId = Number(String(formData.get("bookingId") ?? ""));
  const rating = Math.min(5, Math.max(1, Number(String(formData.get("rating") ?? "5")) || 5));
  const comment = sanitizeText(String(formData.get("comment") ?? ""), 1000);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true },
  });

  if (!booking || booking.passengerId !== user.id) {
    redirect("/panel/bookings?error=notfound");
  }

  const tripEnded = booking!.trip.endDate.getTime() < Date.now();
  const statusOk = ["paid", "completed"].includes(booking!.status);
  if (!tripEnded || !statusOk) {
    redirect(`/panel/bookings/${bookingId}?error=noteligible`);
  }

  const existing = await db.leaderReview.findUnique({
    where: { tripId_passengerId: { tripId: booking!.tripId, passengerId: user.id } },
  });
  if (existing) {
    redirect(`/panel/bookings/${bookingId}?reviewed=1`);
  }

  await db.leaderReview.create({
    data: {
      rating,
      comment: comment || null,
      tripId: booking!.tripId,
      leaderId: booking!.trip.leaderId,
      passengerId: user.id,
    },
  });

  revalidatePath("/leaders");
  revalidatePath(`/leaders/${booking!.trip.leaderId}`);
  redirect(`/panel/bookings/${bookingId}?reviewed=1`);
}
