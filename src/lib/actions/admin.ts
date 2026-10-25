"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

async function requireAdmin() {
  return requireUser(["admin"]);
}

/** Admin approves a leader's trip submission -> leader can publish it. */
export async function approveTripAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/admin/approvals";

  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) redirect(`${back}?error=notfound`);
  if (trip.status !== "pending") redirect(`${back}?error=locked`);

  await db.trip.update({
    where: { id },
    data: {
      status: "approved",
      adminNote: str(formData, "adminNote") || null,
    },
  });
  revalidatePath("/panel/admin");
  redirect(`${back}?approved=${id}`);
}

/** Admin rejects a trip submission (leader can edit & resubmit). */
export async function rejectTripAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/admin/approvals";

  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) redirect(`${back}?error=notfound`);
  if (trip.status !== "pending") redirect(`${back}?error=locked`);

  await db.trip.update({
    where: { id },
    data: {
      status: "rejected",
      adminNote: str(formData, "adminNote") || null,
    },
  });
  revalidatePath("/panel/admin");
  redirect(`${back}?rejected=${id}`);
}

/** Admin cancels a trip entirely; active bookings are cancelled too. */
export async function cancelTripAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/admin/trips";

  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) redirect(`${back}?error=notfound`);
  if (["cancelled", "completed"].includes(trip.status)) {
    redirect(`${back}?error=locked`);
  }

  await db.$transaction([
    db.trip.update({
      where: { id },
      data: {
        status: "cancelled",
        adminNote: str(formData, "adminNote") || "Cancelled by admin",
      },
    }),
    db.booking.updateMany({
      where: { tripId: id, status: { in: ["pending", "approved", "paid"] } },
      data: { status: "cancelled" },
    }),
  ]);
  revalidatePath("/panel/admin");
  revalidatePath("/trips");
  redirect(`${back}?cancelled=${id}`);
}

/** Admin bans a leader from leading a specific trip. */
export async function banLeaderFromTripAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/admin/trips";

  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) redirect(`${back}?error=notfound`);

  await db.trip.update({
    where: { id },
    data: {
      leaderBanned: true,
      adminNote: str(formData, "adminNote") || "Leader banned from this trip",
    },
  });
  revalidatePath("/panel/admin");
  revalidatePath("/trips");
  redirect(`${back}?banned=${id}`);
}

export async function unbanLeaderFromTripAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const back = str(formData, "back") || "/panel/admin/trips";

  await db.trip.update({
    where: { id },
    data: { leaderBanned: false },
  });
  revalidatePath("/panel/admin");
  redirect(`${back}?unbanned=${id}`);
}

/** Admin assigns another leader to a trip. */
export async function reassignLeaderAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const leaderId = Number(str(formData, "leaderId"));
  const back = str(formData, "back") || "/panel/admin/trips";

  const leader = await db.user.findUnique({ where: { id: leaderId } });
  if (!leader || leader.role !== "leader" || leader.isSuspended) {
    redirect(`${back}?error=badleader`);
  }

  await db.trip.update({
    where: { id },
    data: { leaderId, leaderBanned: false },
  });
  revalidatePath("/panel/admin");
  redirect(`${back}?reassigned=${id}`);
}

/** Admin suspends/unsuspends a user account. */
export async function setSuspendedAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const suspended = str(formData, "suspended") === "1";
  const back = str(formData, "back") || "/panel/admin/users";

  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect(`${back}?error=notfound`);
  if (user.role === "admin") redirect(`${back}?error=forbidden`);

  await db.user.update({ where: { id }, data: { isSuspended: suspended } });
  revalidatePath("/panel/admin/users");
  redirect(`${back}?done=${id}`);
}

/** Admin changes a user's role. */
export async function setUserRoleAction(formData: FormData) {
  await requireAdmin();
  const id = Number(str(formData, "id"));
  const role = str(formData, "role");
  const back = str(formData, "back") || "/panel/admin/users";

  if (!["passenger", "leader", "admin"].includes(role)) {
    redirect(`${back}?error=badrole`);
  }
  const user = await db.user.findUnique({ where: { id } });
  if (!user) redirect(`${back}?error=notfound`);

  await db.user.update({ where: { id }, data: { role } });
  revalidatePath("/panel/admin/users");
  redirect(`${back}?done=${id}`);
}
