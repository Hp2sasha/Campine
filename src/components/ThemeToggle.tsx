"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ labelDay, labelNight }: { labelDay: string; labelNight: string }) {
  const { mode, setMode } = useTheme();

  const btn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
      active
        ? "bg-brand-600 text-white shadow-sm"
        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    }`;

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 no-print dark:border-slate-700 dark:bg-slate-900"
      aria-label={mode === "day" ? labelDay : labelNight}
    >
      <button type="button" onClick={() => setMode("day")} className={btn(mode === "day")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        {labelDay}
      </button>
      <button type="button" onClick={() => setMode("night")} className={btn(mode === "night")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
        {labelNight}
      </button>
    </div>
  );
}
