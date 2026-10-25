"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isValidIranianPhone, normalizeIranianPhone } from "@/lib/sms";
import { saveIdCardImage, saveLicenseFiles } from "@/lib/upload";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

/** Public: submit a request to cooperate as a leader. */
export async function submitCooperationAction(formData: FormData) {
  const name = str(formData, "name");
  const phoneRaw = str(formData, "phone");
  const email = str(formData, "email") || null;
  const city = str(formData, "city") || null;
  const message = str(formData, "message");

  if (!name || !message || !isValidIranianPhone(phoneRaw)) {
    redirect("/cooperation?error=required");
  }

  const phone = normalizeIranianPhone(phoneRaw);
  const existing = await db.cooperationRequest.findFirst({
    where: { phone, status: "pending" },
  });
  if (existing) redirect("/cooperation?sent=1");

  const idCard = formData.get("idCard");
  const savedId = await saveIdCardImage(idCard instanceof File ? idCard : null);
  if (!savedId.ok) redirect("/cooperation?error=docs");

  const licenses = formData.getAll("licenses").filter((f): f is File => f instanceof File);
  const savedLicenses = await saveLicenseFiles(licenses);
  if (!savedLicenses.ok) redirect("/cooperation?error=docs");

  await db.cooperationRequest.create({
    data: {
      name,
      phone,
      email,
      city,
      message,
      idCardUrl: savedId.url,
      licenseUrls: JSON.stringify(savedLicenses.urls),
    },
  });
  redirect("/cooperation?sent=1");
}

/** Admin: approve a cooperation request → the applicant becomes a leader. */
export async function approveCooperationAction(formData: FormData) {
  const admin = await requireUser(["admin"]);
  void admin;
  const id = Number(str(formData, "id"));

  const req = await db.cooperationRequest.findUnique({ where: { id } });
  if (!req || req.status !== "pending") redirect("/panel/admin/cooperation?error=locked");

  const phone = req.phone;
  let user = await db.user.findUnique({ where: { phone } });
  if (user) {
    user = await db.user.update({
      where: { id: user.id },
      data: { role: "leader", name: user.name || req.name },
    });
  } else {
    user = await db.user.create({
      data: {
        name: req.name,
        phone,
        email: req.email,
        role: "leader",
      },
    });
  }

  await db.cooperationRequest.update({
    where: { id },
    data: { status: "approved", userId: user.id, adminNote: str(formData, "adminNote") || null },
  });
  revalidatePath("/panel/admin/cooperation");
  redirect("/panel/admin/cooperation?approved=" + id);
}

/** Admin: reject a cooperation request. */
export async function rejectCooperationAction(formData: FormData) {
  await requireUser(["admin"]);
  const id = Number(str(formData, "id"));
  const req = await db.cooperationRequest.findUnique({ where: { id } });
  if (!req || req.status !== "pending") redirect("/panel/admin/cooperation?error=locked");

  await db.cooperationRequest.update({
    where: { id },
    data: { status: "rejected", adminNote: str(formData, "adminNote") || null },
  });
  revalidatePath("/panel/admin/cooperation");
  redirect("/panel/admin/cooperation?rejected=" + id);
}
