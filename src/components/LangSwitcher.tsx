"use client";

import { useRef } from "react";
import { setLocaleAction } from "@/lib/actions/locale";

/**
 * Language switcher — form + server action (cookie is set server-side via
 * Set-Cookie, so it works even when document.cookie is blocked in embeds).
 */
export default function LangSwitcher({
  locale,
  compact = false,
}: {
  locale: string;
  compact?: boolean;
}) {
  const isFa = locale === "fa";
  const backFaRef = useRef<HTMLInputElement>(null);
  const backEnRef = useRef<HTMLInputElement>(null);

  function fillBack(ref: React.RefObject<HTMLInputElement>) {
    return () => {
      if (ref.current) {
        ref.current.value = window.location.pathname + window.location.search;
      }
    };
  }

  const btn = (active: boolean) =>
    `rounded-full px-2.5 py-1 transition ${
      active
        ? "bg-brand-600 text-white"
        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold no-print dark:border-slate-700 dark:bg-slate-900">
      <form action={setLocaleAction} onSubmit={fillBack(backFaRef)}>
        <input type="hidden" name="next" value="fa" />
        <input type="hidden" name="back" ref={backFaRef} defaultValue="/" />
        <button type="submit" className={btn(isFa)}>
          فارسی
        </button>
      </form>
      {!compact && (
        <form action={setLocaleAction} onSubmit={fillBack(backEnRef)}>
          <input type="hidden" name="next" value="en" />
          <input type="hidden" name="back" ref={backEnRef} defaultValue="/" />
          <button type="submit" className={btn(!isFa)}>
            EN
          </button>
        </form>
      )}
    </div>
  );
}
