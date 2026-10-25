import Link from "next/link";
import { getDict } from "@/lib/i18n";

export default function Footer() {
  const dict = getDict();
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 no-print">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white font-bold">S</span>
            <span className="text-lg font-extrabold text-slate-900">{dict.brand}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
            {dict.footer.aboutDesc}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{dict.footer.links}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="text-slate-500 hover:text-brand-700" href="/trips">{dict.nav.trips}</Link></li>
            <li><Link className="text-slate-500 hover:text-brand-700" href="/leaders">{dict.nav.leaders}</Link></li>
            <li><Link className="text-slate-500 hover:text-brand-700" href="/register">{dict.nav.register}</Link></li>
            <li><Link className="text-slate-500 hover:text-brand-700" href="/panel">{dict.nav.panel}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{dict.footer.support}</h3>
          <p className="mt-4 text-sm leading-7 text-slate-500">{dict.footer.contact}</p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {dict.brand} — {dict.footer.rights}
      </div>
    </footer>
  );
}
