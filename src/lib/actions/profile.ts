"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = str(formData, "name");
  const phone = str(formData, "phone");
  const bio = str(formData, "bio");
  const bioEn = str(formData, "bioEn");
  const avatarUrl = str(formData, "avatarUrl");
  const password = str(formData, "password");

  if (!name) redirect("/panel/profile?error=required");

  const data: Record<string, unknown> = {
    name,
    phone: phone || null,
    bio: bio || null,
    bioEn: bioEn || null,
    avatarUrl: avatarUrl || null,
  };
  if (password.length > 0) {
    if (password.length < 6) redirect("/panel/profile?error=password");
    data.passwordHash = await hashPassword(password);
  }

  await db.user.update({ where: { id: user.id }, data });
  revalidatePath("/panel/profile");
  redirect("/panel/profile?saved=1");
}
