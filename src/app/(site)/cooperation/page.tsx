import Link from "next/link";
import { getDict } from "@/lib/i18n";
import Alert from "@/components/Alert";
import { submitCooperationAction } from "@/lib/actions/cooperation";

export const dynamic = "force-dynamic";

export default async function CooperationPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string };
}) {
  const dict = getDict();
  const t = dict.coop;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="text-2xl font-extrabold text-slate-900">{t.title}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">{t.sub}</p>

        {/* Link to the required-documents page */}
        <Link
          href="/cooperation/documents"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
          {t.docsLink} ←
        </Link>

        {searchParams.sent && (
          <Alert tone="success" className="mt-6">
            {t.sent}
          </Alert>
        )}
        {searchParams.error && (
          <Alert tone="error" className="mt-6">
            {searchParams.error === "docs" ? t.idCardUpload + " — " + dict.auth.errRequired : dict.auth.errRequired}
          </Alert>
        )}

        <form action={submitCooperationAction} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.name}
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder={dict.auth.namePh}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.phone}
            </label>
            <input
              type="tel"
              name="phone"
              required
              dir="ltr"
              placeholder={dict.auth.phonePh}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.email}
            </label>
            <input
              type="email"
              name="email"
              dir="ltr"
              placeholder="example@mail.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.city}
            </label>
            <input
              type="text"
              name="city"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.message}
            </label>
            <textarea
              name="message"
              required
              rows={5}
              placeholder={t.messagePh}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          {/* Document uploads */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.idCardUpload}
            </label>
            <input
              type="file"
              name="idCard"
              required
              accept="image/jpeg,image/png,image/webp"
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-700"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.licensesUpload}
            </label>
            <input
              type="file"
              name="licenses"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-700"
            />
            <p className="mt-1.5 text-xs text-slate-500">{t.licensesHint}</p>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {t.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
