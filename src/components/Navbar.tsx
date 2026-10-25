import Link from "next/link";
import clsx from "clsx";
import { getDict, getLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";
import { logoutAction as doLogout } from "@/lib/actions/auth";

export default async function Navbar() {
  const dict = getDict();
  const locale = getLocale();
  const user = await getCurrentUser();

  const links = [
    { href: "/", label: dict.nav.home },
    { href: "/#featured-trips", label: dict.nav.trips },
    { href: "/#top-leaders", label: dict.nav.leaders },
    { href: "/cooperation", label: dict.nav.coop },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17h18M5 17l2-9h10l2 9M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
            </svg>
          </span>
          <span className="text-lg font-extrabold text-slate-900">{dict.brand}</span>
        </Link>

        <nav className="mx-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle labelDay={dict.home.modeDay} labelNight={dict.home.modeNight} />
          <LangSwitcher locale={locale} />
          {user ? (
            <>
              <Link
                href="/panel"
                className={`hidden rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 sm:inline-flex ${locale === "en" ? "px-3.5 py-1.5 text-xs font-bold" : "px-4 py-2 text-sm font-semibold"}`}
              >
                {dict.nav.panel}
              </Link>
              <form action={doLogout}>
                <button
                  type="submit"
                  className={`hidden rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:inline-flex ${locale === "en" ? "px-3 py-1.5 text-xs font-bold" : "px-3 py-2 text-sm font-semibold"}`}
                >
                  {dict.nav.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`hidden rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 sm:inline-flex ${locale === "en" ? "px-3.5 py-1.5 text-xs font-bold" : "px-4 py-2 text-sm font-semibold"}`}
              >
                {dict.nav.login}
              </Link>
              <Link
                href="/register"
                className={`hidden rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 sm:inline-flex ${locale === "en" ? "px-3.5 py-1.5 text-xs font-bold" : "px-4 py-2 text-sm font-semibold"}`}
              >
                {dict.nav.register}
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <details className="relative md:hidden">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 text-slate-700 [&::-webkit-details-marker]:hidden">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </summary>
            <div className="absolute end-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-slate-100 p-2">
                {user ? (
                  <>
                    <Link href="/panel" className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                      {dict.nav.panel}
                    </Link>
                    <form action={doLogout}>
                      <button className="block w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        {dict.nav.logout}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {dict.nav.login}
                    </Link>
                    <Link href="/register" className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                      {dict.nav.register}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
