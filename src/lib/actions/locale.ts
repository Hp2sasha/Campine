"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

function safePath(back: string): string {
  // only allow same-origin relative paths
  if (back && back.startsWith("/") && !back.startsWith("//")) return back;
  return "/";
}

/** Server-side locale switch: sets the cookie via HTTP and redirects back. */
export async function setLocaleAction(formData: FormData) {
  const next = String(formData.get("next") ?? "fa");
  const back = String(formData.get("back") ?? "/");
  // Detect HTTPS for iframe compatibility (same logic as auth.ts)
  let isHttps = false;
  try {
    const h = headers();
    const proto = h.get("x-forwarded-proto") || "";
    const referer = h.get("referer") || "";
    const host = h.get("host") || "";
    if (
      proto === "https" ||
      referer.startsWith("https://") ||
      host.includes("e2b.app") ||
      host.includes("e2b.dev") ||
      host.includes("arena")
    )
      isHttps = true;
  } catch {}
  if (isHttps) {
    cookies().set("locale", next === "en" ? "en" : "fa", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "none",
      secure: true,
      // @ts-ignore
      partitioned: true,
    } as any);
  } else {
    cookies().set("locale", next === "en" ? "en" : "fa", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  redirect(safePath(back));
}
