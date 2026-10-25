import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import Alert from "@/components/Alert";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

const DEMO_NUMBERS = [
  { label: "Admin", phone: "09121234567" },
  { label: "Leader", phone: "09121112233" },
  { label: "Passenger", phone: "09351234567" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; registered?: string; loggedout?: string };
}) {
  const dict = getDict();
  const locale = getLocale();
  const isEn = locale === "en";

  const errorMessage: Record<string, string> = {
    invalid: dict.auth.errInvalid,
    suspended: dict.auth.suspended,
    required: dict.auth.errRequired,
  };

  return (
    <main className={`mx-auto flex flex-col px-4 py-10 sm:py-14 ${isEn ? "max-w-[26rem]" : "max-w-md"}`}>
      <div className={`rounded-3xl border border-slate-200 bg-white shadow-card ${isEn ? "p-6 sm:p-7" : "p-8"}`}>
        <h1 className={`font-extrabold text-slate-900 ${isEn ? "text-xl sm:text-[1.35rem] leading-tight" : "text-2xl"}`}>{dict.auth.loginTitle}</h1>
        <p className={`mt-2 text-slate-500 ${isEn ? "text-[13px] leading-5" : "text-sm"}`}>{dict.auth.loginSub}</p>

        {searchParams.error && errorMessage[searchParams.error] && (
          <Alert tone="error" className="mt-6">
            {errorMessage[searchParams.error]}
          </Alert>
        )}
        {searchParams.registered && (
          <Alert tone="success" className="mt-6">
            {dict.auth.registerDone}
          </Alert>
        )}
        {searchParams.loggedout && (
          <Alert tone="info" className="mt-6">
            {dict.auth.logoutDone}
          </Alert>
        )}

        <div className="mt-8">
          <LoginForm t={{ ...dict.auth, name: dict.common.name, email: dict.common.email, optional: dict.common.optional }} />
        </div>
      </div>

      {/* Demo numbers */}
      <div className={`mt-6 rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 ${isEn ? "p-5" : "p-6"}`}>
        <h2 className={`font-extrabold text-brand-900 ${isEn ? "text-[13px]" : "text-sm"}`}>{dict.auth.demoTitle}</h2>
        <ul className="mt-3 space-y-2 text-xs text-brand-900/80" dir="ltr">
          {DEMO_NUMBERS.map((d) => (
            <li key={d.phone}>
              <b>{d.label}:</b> {d.phone}
            </li>
          ))}
        </ul>
        <p className={`mt-3 leading-6 text-brand-900/70 ${isEn ? "text-[11px]" : "text-xs"}`}>{dict.auth.demoHint}</p>
      </div>
    </main>
  );
}
