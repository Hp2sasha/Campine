"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loginStep1Action, loginStep2Action } from "@/lib/actions/auth";

type T = Record<string, string>;

const RESEND_COOLDOWN = 60; // ثانیه — با سرور هماهنگ (otp.ts)

function parseWaitSeconds(msg: string): number | null {
  const m = msg.match(/(\d+)\s*ثانیه/);
  return m ? Number(m[1]) : null;
}

export default function LoginForm({ t }: { t: T }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // شمارشِ معکوسِ هر ثانیه
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function sendCode() {
    if (cooldown > 0) return;
    setBusy(true);
    setError("");
    setDevCode("");
    const res = await loginStep1Action(phone);
    setBusy(false);
    if (!res.ok) {
      const wait = parseWaitSeconds(res.error);
      if (wait) setCooldown(wait);
      setError(res.error);
      return;
    }
    if (res.mock && res.devCode) setDevCode(res.devCode);
    setCooldown(RESEND_COOLDOWN);
    setStep(2);
  }

  async function verify() {
    setBusy(true);
    setError("");
    const res = await loginStep2Action(phone, code);
    setBusy(false);
    if (!res.ok) setError(res.error);
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500";

  return (
    <div>
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t.phoneLabel}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePh}
              className={inputCls}
            />
          </div>
          <button
            type="button"
            disabled={busy || !phone}
            onClick={sendCode}
            className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "..." : t.sendCode}
          </button>
          <p className="text-xs leading-6 text-slate-500">{t.smsNote}</p>
        </div>
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
                setCooldown(0);
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
            {busy ? "..." : t.verifyLoginBtn}
          </button>
          <button
            type="button"
            disabled={busy || cooldown > 0}
            onClick={sendCode}
            className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 enabled:text-slate-600 enabled:hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {cooldown > 0 ? `${t.resend} (${cooldown} ثانیه)` : t.resend}
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
        {t.noAccount}{" "}
        <Link href="/register" className="font-bold text-brand-700 hover:underline">
          {t.registerBtn}
        </Link>
      </p>
    </div>
  );
}
