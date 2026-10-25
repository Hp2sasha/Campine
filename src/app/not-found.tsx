import Link from "next/link";
import { getDict } from "@/lib/i18n";

export default function NotFound() {
  const dict = getDict();
  return (
    <main className="grid min-h-[70vh] place-items-center px-4">
      <div className="text-center">
        <div className="text-7xl font-extrabold text-brand-600">404</div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
          {dict.common.notFound}
        </h1>
        <p className="mt-2 text-slate-500">{dict.common.notFoundSub}</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {dict.nav.home}
        </Link>
      </div>
    </main>
  );
}
