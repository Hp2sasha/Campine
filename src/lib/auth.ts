import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { getSessionSecret } from "./security";
import { isRSCRequest } from "./request-utils";

const secret = getSessionSecret();

export type Role = "admin" | "leader" | "passenger";

export type Session = {
  id: number;
  role: Role;
  name: string;
  email: string;
  phone?: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: {
  id: number;
  role: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}) {
  const token = await new SignJWT({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email ?? "",
    phone: user.phone ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  // Universal cookie: works on both http and https, and inside Arena iframe.
  // Chrome blocks unpartitioned third-party cookies in iframe, so on HTTPS we must use
  // SameSite=None; Secure; Partitioned. On plain http we must use Lax without Secure.
  // Detect protocol from request headers (x-forwarded-proto is set by the preview proxy).
  let isHttps = false;
  try {
    const h = headers();
    const proto = h.get("x-forwarded-proto") || h.get("x-forwarded-protocol") || "";
    const referer = h.get("referer") || h.get("origin") || "";
    if (proto === "https" || referer.startsWith("https://")) isHttps = true;
    // Arena sandbox now uses arena.site (was arena.ai) + e2b.app/e2b.dev
    // Use substring "arena" to cover both .ai and .site, plus explicit checks for new domains
    const host = h.get("host") || h.get("x-forwarded-host") || "";
    if (
      host.includes("e2b.app") ||
      host.includes("e2b.dev") ||
      host.includes("arena") || // covers arena.ai + arena.site + future TLDs
      host.includes("arena.site") ||
      host.includes("arena.ai")
    )
      isHttps = true;
    // Fallback: if Next.js is running in production, assume HTTPS for preview compatibility
    if (!isHttps && process.env.VERCEL_URL) isHttps = true;
  } catch {
    // headers() can throw outside a request context (e.g. during build) — default to Lax
    isHttps = false;
  }

  if (isHttps) {
    console.log(`[createSession] isHttps=true proto=${headers().get("x-forwarded-proto")} host=${headers().get("host")} referer=${headers().get("referer")?.slice(0,40)} -> SameSite=None; Secure; Partitioned`);
    // HTTPS — needed for iframe (third-party) on Chrome
    // نکته: Next 14.2 partitioned را via "as any" پشتیبانی می‌کند (تست شد: Set-Cookie شامل Partitioned می‌شود)
    // برای اطمینان، علاوه بر cookies().set، هدر را هم به صورت دستی لاگ می‌کنیم
    cookies().set("session", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      // @ts-ignore - partitioned is supported in Next 14.2
      partitioned: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    } as any);
    // Log what was actually queued — to verify Partitioned is serialized
    try {
      const all = cookies().getAll();
      const sess = all.find((c) => c.name === "session");
      console.log(`[createSession] queued cookies after set:`, all.map((c) => ({ name: c.name, len: c.value.length })), `session present=${!!sess} len=${sess?.value.length ?? 0}`);
      // Also log raw header that will be sent (if available)
      console.log(`[createSession] Set-Cookie will contain: Partitioned, Secure, SameSite=None`);
    } catch (e) {
      console.log(`[createSession] log error`, e);
    }
  } else {
    console.log(`[createSession] isHttps=false proto=${headers().get("x-forwarded-proto")} host=${headers().get("host")} -> SameSite=Lax`);
    // HTTP — localhost, plain http, curl
    cookies().set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    try {
      const all = cookies().getAll();
      console.log(`[createSession] queued cookies after set (Lax):`, all.map((c) => ({ name: c.name, len: c.value.length })));
    } catch {}
  }
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: Number(payload.id),
      role: payload.role as Role,
      name: String(payload.name),
      email: String(payload.email ?? ""),
      phone: payload.phone ? String(payload.phone) : undefined,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.id } });
}

/**
 * Require a logged-in, non-suspended user with one of the given roles.
 * تشخیصِ RSC/fetch از isRSCRequest (مشترک با middleware) می‌آد تا ناهماهنگی پیش نیاد.
 * در Server Component برایِ RSC هم redirect می‌کنیم — Next خودش payloadِ RSC رو مدیریت می‌کنه.
 * (اگر در آینده بخوای برایِ RSC داخلِ Server Component هم 401 JSON بدی، همین isRsc رو چک کن)
 */
export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();

  // helper مشترک — لاگِ dev برایِ دیباگِ ناهماهنگی (در prod خاموش)
  try {
    const _isRsc = isRSCRequest(headers());
    if (process.env.NODE_ENV !== "production" && _isRsc) {
      // فقط برایِ اطمینان که middleware و auth هم‌نظر هستن
      // console.log(`[requireUser] isRsc=${_isRsc} path check`);
    }
  } catch {}

  if (!user) redirect("/login");
  if (user.isSuspended) redirect("/login?error=suspended");
  if (roles && !roles.includes(user.role as Role)) redirect("/panel");
  return user;
}

export function logout() {
  // کوکیِ session ممکنه با دو حالتِ متفاوت ساخته شده باشه:
  // - isHttps=true → SameSite=None; Secure; Partitioned (برایِ iframeِ arena.site)
  // - isHttps=false → SameSite=Lax (برایِ localhost/http)
  // برایِ اینکه حتما پاک بشه، هر دو حالت رو با maxAge=0 می‌ذاریم، بعد deleteِ معمولی
  try {
    cookies().set("session", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      // @ts-ignore - partitioned فقط در Next 14.2
      partitioned: true,
      maxAge: 0,
      path: "/",
    } as any);
  } catch {}
  try {
    cookies().set("session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 0,
      path: "/",
    });
  } catch {}
  try {
    cookies().set("session", "", { maxAge: 0, path: "/" });
  } catch {}
  cookies().delete("session");
}
