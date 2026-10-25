import Link from "next/link";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function CooperationDocsPage() {
  const dict = getDict();
  const t = dict.coop;

  const docs = [t.docs1, t.docs2, t.docs3, t.docs4, t.docs5, t.docs6, t.docs7];

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="text-2xl font-extrabold text-slate-900">{t.docsTitle}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">{t.docsSub}</p>

        <h2 className="mt-8 text-base font-extrabold text-slate-800">{t.docsListTitle}</h2>
        <ol className="mt-4 space-y-3">
          {docs.map((d, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              {d}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/cooperation"
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {t.docsBack} →
          </Link>
        </div>
      </div>
    </main>
  );
}
