"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function code(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

async function seatsUsed(tripId: number, excludeBookingId?: number) {
  const bookings = await db.booking.findMany({
    where: {
      tripId,
      status: { in: ["pending", "approved", "paid"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { seats: true },
  });
  return bookings.reduce((s, b) => s + b.seats, 0);
}

/** Passenger submits an initial booking request (no payment yet). */
export async function requestBookingAction(formData: FormData) {
  const user = await requireUser(["passenger"]);
  const tripId = Number(str(formData, "tripId"));
  const seats = Number(str(formData, "seats") || "1");
  const note = str(formData, "note");

  const trip = await db.trip.findUnique({ where: { id: tripId } });
  if (
    !trip ||
    trip.status !== "published" ||
    trip.leaderBanned ||
    new Date(trip.endDate) < new Date()
  ) {
    redirect(`/trips/${tripId}?error=unavailable`);
  }
  if (!Number.isFinite(seats) || seats < 1) {
    redirect(`/trips/${tripId}?error=seats`);
  }

  const used = await seatsUsed(tripId);
  if (used + seats > trip.capacity) {
    redirect(`/trips/${tripId}?error=capacity`);
  }

  const booking = await db.booking.create({
    data: {
      code: code("BK"),
      tripId,
      passengerId: user.id,
      seats,
      note: note || null,
      status: "pending",
    },
  });

  revalidatePath("/panel/bookings");
  redirect(`/panel/bookings?success=1&code=${booking.code}`);
}

/** Leader approves an initial request -> passenger may pay. */
export async function approveBookingAction(formData: FormData) {
  const user = await requireUser(["leader", "admin"]);
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/leader/requests";

  const booking = await db.booking.findUnique({
    where: { id },
    include: { trip: true },
  });
  if (!booking) redirect(`${back}?error=notfound`);
  if (booking.trip.leaderId !== user.id && user.role !== "admin") {
    redirect(`${back}?error=forbidden`);
  }
  if (booking.status !== "pending") redirect(`${back}?error=locked`);
  if (booking.trip.leaderBanned) redirect(`${back}?error=banned`);

  const used = await seatsUsed(booking.tripId, booking.id);
  if (used + booking.seats > booking.trip.capacity) {
    redirect(`${back}?error=capacity&id=${id}`);
  }

  await db.booking.update({
    where: { id },
    data: {
      status: "approved",
      leaderNote: str(formData, "leaderNote") || null,
    },
  });
  revalidatePath("/panel/leader/requests");
  revalidatePath("/panel/bookings");
  redirect(`${back}?approved=${id}`);
}

/** Leader rejects an initial request. */
export async function rejectBookingAction(formData: FormData) {
  const user = await requireUser(["leader", "admin"]);
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/leader/requests";

  const booking = await db.booking.findUnique({
    where: { id },
    include: { trip: true },
  });
  if (!booking) redirect(`${back}?error=notfound`);
  if (booking.trip.leaderId !== user.id && user.role !== "admin") {
    redirect(`${back}?error=forbidden`);
  }
  if (booking.status !== "pending") redirect(`${back}?error=locked`);

  await db.booking.update({
    where: { id },
    data: {
      status: "rejected",
      leaderNote: str(formData, "leaderNote") || null,
    },
  });
  revalidatePath("/panel/leader/requests");
  revalidatePath("/panel/bookings");
  redirect(`${back}?rejected=${id}`);
}

/** Passenger cancels own unpaid booking; leader/admin can cancel too. */
export async function cancelBookingAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/bookings";

  const booking = await db.booking.findUnique({
    where: { id },
    include: { trip: true },
  });
  if (!booking) redirect(`${back}?error=notfound`);

  const isOwner = booking.passengerId === user.id;
  const isLeader = booking.trip.leaderId === user.id;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isLeader && !isAdmin) {
    redirect(`${back}?error=forbidden`);
  }
  if (["cancelled", "completed", "rejected"].includes(booking.status)) {
    redirect(`${back}?error=locked`);
  }
  // Passenger cannot cancel after payment (needs admin/leader).
  if (isOwner && booking.status === "paid" && !isLeader && !isAdmin) {
    redirect(`${back}?error=paid`);
  }

  await db.booking.update({ where: { id }, data: { status: "cancelled" } });
  revalidatePath("/panel/bookings");
  revalidatePath("/panel/leader/requests");
  redirect(`${back}?cancelled=${id}`);
}
