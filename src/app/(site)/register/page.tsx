import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import Alert from "@/components/Alert";
import RegisterForm from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const dict = getDict();
  const locale = getLocale();
  const isEn = locale === "en";

  const errorMessage: Record<string, string> = {
    required: dict.auth.errRequired,
    exists: dict.auth.errExists,
  };

  return (
    <main className={`mx-auto flex flex-col px-4 py-10 sm:py-14 ${isEn ? "max-w-[26rem]" : "max-w-md"}`}>
      <div className={`rounded-3xl border border-slate-200 bg-white shadow-card ${isEn ? "p-6 sm:p-7" : "p-8"}`}>
        <h1 className={`font-extrabold text-slate-900 ${isEn ? "text-xl sm:text-[1.35rem] leading-tight" : "text-2xl"}`}>{dict.auth.registerTitle}</h1>
        <p className={`mt-2 text-slate-500 ${isEn ? "text-[13px] leading-5" : "text-sm"}`}>{dict.auth.registerSub}</p>

        {searchParams.error && errorMessage[searchParams.error] && (
          <Alert tone="error" className="mt-6">
            {errorMessage[searchParams.error]}
          </Alert>
        )}

        <div className="mt-8">
          <RegisterForm
            t={{
              ...dict.auth,
              name: dict.common.name,
              email: dict.common.email,
              optional: dict.common.optional,
            }}
          />
        </div>
      </div>

      {/* Leaders apply separately */}
      <div className={`mt-6 rounded-3xl border border-slate-200 bg-white text-center ${isEn ? "p-5" : "p-6"}`}>
        <p className={`font-semibold text-slate-600 ${isEn ? "text-[13px]" : "text-sm"}`}>{dict.coop.registerNote}</p>
        <Link
          href="/cooperation"
          className="mt-4 inline-flex rounded-xl border border-brand-200 bg-brand-50 px-6 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-100"
        >
          {dict.coop.title} →
        </Link>
      </div>
    </main>
  );
}
