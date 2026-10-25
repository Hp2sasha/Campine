"use client";

import { useState } from "react";
import Link from "next/link";
import { registerStep1Action, registerStep2Action } from "@/lib/actions/auth";

type T = Record<string, string>;

export default function RegisterForm({ t }: { t: T }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [idCardUrl, setIdCardUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitStep1() {
    setBusy(true);
    setError("");
    setDevCode("");
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", phone);
    fd.set("email", email);
    if (file) fd.set("idCard", file);
    const res = await registerStep1Action(fd);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.mock && res.devCode) setDevCode(res.devCode);
    if (res.idCardUrl) setIdCardUrl(res.idCardUrl);
    setStep(2);
  }

  async function verify() {
    setBusy(true);
    setError("");
    const res = await registerStep2Action({
      name,
      phone,
      email: email || null,
      idCardUrl,
      code,
    });
    setBusy(false);
    if (!res.ok) setError(res.error);
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500";

  return (
    <div>
      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitStep1();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.name}
            </label>
            <input
              type="text"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePh}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.phoneLabel}
            </label>
            <input
              type="tel"
              name="phone"
              inputMode="numeric"
              dir="ltr"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePh}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.email} ({t.optional})
            </label>
            <input
              type="email"
              name="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPh}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.idCardLabel}
            </label>
            <input
              type="file"
              name="idCard"
              required
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-700"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {t.idCardHint}
              {file ? ` — ${file.name}` : ""}
            </p>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "..." : t.sendCode}
          </button>
          <p className="text-xs leading-6 text-slate-500">{t.smsNote}</p>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            <span dir="ltr" className="font-semibold text-slate-700">{phone}</span>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCode("");
                setDevCode("");
                setError("");
              }}
              className="text-xs font-bold text-brand-700 hover:underline"
            >
              {t.changePhone}
            </button>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.codeLabel}
            </label>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.codePh}
              className={`${inputCls} text-center text-lg tracking-[0.5em]`}
            />
          </div>
          <button
            type="button"
            disabled={busy || code.length < 4}
            onClick={verify}
            className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "..." : t.verifyRegisterBtn}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submitStep1}
            className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t.resend}
          </button>
        </div>
      )}

      {devCode && (
        <div
          dir="ltr"
          className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800"
        >
          SMS (demo): <span className="tracking-[0.3em]">{devCode}</span>
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-bold text-brand-700 hover:underline">
          {t.loginBtn}
        </Link>
      </p>
    </div>
  );
}
