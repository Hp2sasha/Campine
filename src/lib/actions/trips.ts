"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { gregorianToJalaliStr } from "@/lib/jalali";
import { sanitizeText, sanitizeUrl, assertOrigin } from "@/lib/sanitize";

function code(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

/**
 * Leader saves a trip (create or update).
 * - "submitNow=1" also sends it to admin for approval.
 * - After admin approval the leader publishes it (publishTripAction).
 */
export async function saveTripAction(formData: FormData) {
  assertOrigin();
  const user = await requireUser(["leader", "admin"]);

  const id = str(formData, "id");
  const rawTitle = sanitizeText(str(formData, "title"), 120);
  const rawDestination = sanitizeText(str(formData, "destination"), 120);
  const title = rawTitle;
  const destination = rawDestination;
  const startDate = str(formData, "startDate");
  const endDate = str(formData, "endDate");
  const price = Number(str(formData, "price"));
  const capacity = Number(str(formData, "capacity"));
  const submitNow = str(formData, "submitNow") === "1";

  const errorBase = id ? `/panel/leader/trips/${id}/edit` : "/panel/leader/trips/new";

  if (!title || !destination || !startDate || !endDate) {
    redirect(`${errorBase}?error=required`);
  }
  if (new Date(endDate) <= new Date(startDate)) {
    redirect(`${errorBase}?error=dateOrder`);
  }
  if (!Number.isFinite(price) || price < 0 || price > 500_000_000) {
    redirect(`${errorBase}?error=price`);
  }
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 200) {
    redirect(`${errorBase}?error=capacity`);
  }

  // Build jalali mirrors for bilingual storage/search
  const startJalali = gregorianToJalaliStr(startDate);
  const endJalali = gregorianToJalaliStr(endDate);

  const data = {
    title,
    titleEn: (sanitizeText(str(formData, "titleEn"), 120) || null) as any,
    destination,
    destinationEn: (sanitizeText(str(formData, "destinationEn"), 120) || null) as any,
    description: sanitizeText(str(formData, "description"), 4000),
    descriptionEn: sanitizeText(str(formData, "descriptionEn"), 4000),
    includes: sanitizeText(str(formData, "includes"), 2000),
    includesEn: sanitizeText(str(formData, "includesEn"), 2000),
    excludes: sanitizeText(str(formData, "excludes"), 2000),
    excludesEn: sanitizeText(str(formData, "excludesEn"), 2000),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    startDateJalali: startJalali,
    endDateJalali: endJalali,
    price,
    capacity,
    imageUrl: sanitizeUrl(str(formData, "imageUrl")) || null,
  };

  if (id) {
    const trip = await db.trip.findUnique({ where: { id: Number(id) } });
    if (!trip) redirect("/panel/leader/trips?error=notfound");
    if (trip.leaderId !== user.id && user.role !== "admin") {
      redirect("/panel/leader/trips?error=forbidden");
    }
    if (["cancelled", "completed"].includes(trip.status)) {
      redirect(`/panel/leader/trips?error=locked`);
    }
    await db.trip.update({
      where: { id: trip.id },
      data: {
        ...data,
        ...(submitNow ? { status: "pending" } : {}),
      },
    });
    redirect(`/panel/leader/trips?updated=1`);
  }

  const trip = await db.trip.create({
    data: {
      ...data,
      code: code("TR"),
      status: submitNow ? "pending" : "draft",
      leaderId: user.id,
    },
  });
  redirect(`/panel/leader/trips?created=1&id=${trip.id}`);
}

/** Send a draft/rejected trip to admin for approval. */
export async function submitTripAction(formData: FormData) {
  const user = await requireUser(["leader", "admin"]);
  const id = Number(str(formData, "id"));
  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) redirect("/panel/leader/trips?error=notfound");
  if (trip.leaderId !== user.id && user.role !== "admin") {
    redirect("/panel/leader/trips?error=forbidden");
  }
  if (trip.leaderBanned) redirect("/panel/leader/trips?error=banned");
  if (!["draft", "rejected"].includes(trip.status)) {
    redirect("/panel/leader/trips?error=locked");
  }
  await db.trip.update({ where: { id }, data: { status: "pending" } });
  revalidatePath("/panel/leader/trips");
  redirect("/panel/leader/trips?submitted=1");
}

/** After admin approval the leader publishes (uploads) the trip. */
export async function publishTripAction(formData: FormData) {
  const user = await requireUser(["leader", "admin"]);
  const id = Number(str(formData, "id"));
  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) redirect("/panel/leader/trips?error=notfound");
  if (trip.leaderId !== user.id && user.role !== "admin") {
    redirect("/panel/leader/trips?error=forbidden");
  }
  if (trip.leaderBanned) redirect("/panel/leader/trips?error=banned");
  if (trip.status !== "approved") redirect("/panel/leader/trips?error=locked");

  await db.trip.update({ where: { id }, data: { status: "published" } });
  revalidatePath("/trips");
  revalidatePath("/panel/leader/trips");
  redirect("/panel/leader/trips?published=1");
}

/** Leader/admin marks a finished trip as completed. */
export async function completeTripAction(formData: FormData) {
  const user = await requireUser(["leader", "admin"]);
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/leader/trips";
  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) redirect(`${back}?error=notfound`);
  if (trip.leaderId !== user.id && user.role !== "admin") {
    redirect(`${back}?error=forbidden`);
  }
  if (!["published", "approved"].includes(trip.status)) {
    redirect(`${back}?error=locked`);
  }

  await db.$transaction([
    db.trip.update({ where: { id }, data: { status: "completed" } }),
    db.booking.updateMany({
      where: { tripId: id, status: "paid" },
      data: { status: "completed" },
    }),
  ]);
  revalidatePath("/panel/leader/completed");
  redirect(`${back}?done=1`);
}
