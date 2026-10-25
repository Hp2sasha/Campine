import Link from "next/link";
import clsx from "clsx";
import { getDict, getLocale } from "@/lib/i18n";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";
import PrintButton from "./PrintButton";
import { logoutAction } from "@/lib/actions/auth";

export default function PanelShell({
  user,
  children,
  active,
}: {
  user: { id: number; name: string; email?: string | null; role: string };
  children: React.ReactNode;
  active: string;
}) {
  const dict = getDict();
  const locale = getLocale();

  const commonItems = [{ href: "/panel", key: "overview", label: dict.panel.overview }];

  const roleItems: Record<string, { href: string; key: string; label: string }[]> = {
    passenger: [
      { href: "/panel/bookings", key: "bookings", label: dict.panel.myBookings },
    ],
    leader: [
      { href: "/panel/leader/trips", key: "trips", label: dict.panel.myTrips },
      { href: "/panel/leader/trips/new", key: "new", label: dict.panel.newTrip },
      { href: "/panel/leader/requests", key: "requests", label: dict.panel.requests },
      { href: "/panel/leader/completed", key: "completed", label: dict.panel.completedTrips },
    ],
    admin: [
      { href: "/panel/admin/approvals", key: "approvals", label: dict.panel.approvals },
      { href: "/panel/admin/trips", key: "trips", label: dict.panel.adminTrips },
      { href: "/panel/admin/bookings", key: "bookings", label: dict.panel.adminBookings },
      { href: "/panel/admin/users", key: "users", label: dict.panel.adminUsers },
      { href: "/panel/admin/cooperation", key: "cooperation", label: dict.coop.adminTitle },
    ],
  };

  // Leaders can also act as passengers
  const items = [
    ...commonItems,
    ...(roleItems[user.role] ?? []),
    ...(user.role === "leader"
      ? [{ href: "/panel/bookings", key: "bookings", label: dict.panel.myBookings }]
      : []),
    ...(user.role === "admin"
      ? [{ href: "/panel/leader/trips", key: "trips", label: dict.panel.myTrips }]
      : []),
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-64 no-print">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            {user.name.slice(0, 1) ? (
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-base font-extrabold text-white">
                {user.name.slice(0, 1)}
              </span>
            ) : null}
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900">{user.name}</div>
              <div className="text-xs font-semibold text-brand-700">
                {dict.roles[user.role as keyof typeof dict.roles]}
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1">
            {items.map((item) => (
              <Link
                key={item.key + item.href}
                href={item.href}
                className={clsx(
                  "block rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  active === item.key
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/panel/profile"
              className={clsx(
                "block rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                active === "profile"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {dict.panel.profile}
            </Link>
          </nav>

          <form action={logoutAction} className="mt-5 border-t border-slate-100 pt-4">
            <button
              type="submit"
              className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              {dict.nav.logout}
            </button>
          </form>
        </div>

        <Link
          href="/trips"
          className="mt-4 block rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          ← {dict.booking.browseTrips}
        </Link>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-brand-700">
              {dict.brand}
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-xl font-extrabold text-slate-900">
              {items.find((i) => i.key === active)?.label ??
                (active === "profile" ? dict.panel.profile : dict.panel.welcome)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle labelDay={dict.home.modeDay} labelNight={dict.home.modeNight} />
            <LangSwitcher locale={locale} />
            <PrintButton label={dict.panel.printPage} />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "amber" | "blue" | "violet" | "red";
}) {
  const accents = {
    brand: "from-brand-500 to-teal-600",
    amber: "from-amber-400 to-orange-500",
    blue: "from-sky-400 to-blue-600",
    violet: "from-violet-400 to-purple-600",
    red: "from-rose-400 to-red-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-1.5 rounded-full bg-gradient-to-b ${accents[accent]}`} />
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="text-2xl font-extrabold text-slate-900">{value}</div>
          {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
        </div>
      </div>
    </div>
  );
}
