// فقط در dev/preview — در پروداکشن غیرفعال
export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEBUG_ROUTES) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = cookies().get("session");
  const locale = cookies().get("locale");
  return NextResponse.json({
    hasSession: !!session,
    sessionLength: session?.value.length ?? 0,
    sessionPreview: session ? session.value.slice(0, 20) + "..." : null,
    locale: locale?.value ?? null,
    allCookies: cookies().getAll().map(c => ({ name: c.name, length: c.value.length })),
    timestamp: new Date().toISOString(),
  });
}
