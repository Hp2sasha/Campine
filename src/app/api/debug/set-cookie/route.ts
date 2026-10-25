export const dynamic = "force-dynamic";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEBUG_ROUTES) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "none";
  const host = h.get("host") || "none";
  const referer = h.get("referer") || "none";
  const isHttps = proto === "https" || host.includes("e2b.app") || host.includes("e2b.dev") || host.includes("arena") || referer.startsWith("https://");
  
  const value = `test-${Date.now()}`;
  
  if (isHttps) {
    cookies().set("test_partitioned", value, {
      httpOnly: false,
      sameSite: "none",
      secure: true,
      // @ts-ignore
      partitioned: true,
      maxAge: 3600,
      path: "/",
    } as any);
  } else {
    cookies().set("test_partitioned", value, {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
      maxAge: 3600,
      path: "/",
    });
  }
  
  return NextResponse.json({
    set: value,
    isHttps,
    proto,
    host,
    referer: referer.slice(0, 50),
    setCookieHeader: "check via Network tab",
  });
}

export async function POST() {
  return GET(new Request("http://test"));
}
