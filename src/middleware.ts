import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isRSCRequest } from "./lib/request-utils";

function getSecret() {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET missing");
    return new TextEncoder().encode("safaryar-dev-secret-please-change-in-production-32+chars");
  }
  return new TextEncoder().encode(raw);
}
const secret = getSecret();

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;

  const isRscFetch = isRSCRequest(req.headers);

  if (!token) {
    if (isRscFetch) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", redirectTo: "/login" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // فقط در dev لاگ
    if (process.env.NODE_ENV !== "production") {
      console.log(`[middleware] jwtVerify failed for ${req.nextUrl.pathname}`);
    }
    if (isRscFetch) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", redirectTo: "/login" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/panel/:path*"],
};
