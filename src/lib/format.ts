import { toJalaali, formatJalaliLong } from "./jalali";

export type Locale = "fa" | "en";

export function formatToman(amount: number, locale: Locale = "fa") {
  const n = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(
    amount
  );
  return locale === "fa" ? `${n} تومان` : `${n} TOMAN`;
}

export function formatDate(date: Date | string, locale: Locale = "fa") {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "fa") {
    // Use Jalali calendar via our converter for predictable output
    // e.g. 14 مهر 1404
    return formatJalaliLong(d, "fa");
  }
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale = "fa") {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "fa") {
    const datePart = formatDate(d, "fa");
    const timePart = new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return `${datePart}، ساعت ${timePart}`;
  }
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateRange(
  start: Date | string,
  end: Date | string,
  locale: Locale = "fa"
) {
  return `${formatDate(start, locale)} — ${formatDate(end, locale)}`;
}

export function tripDays(start: Date | string, end: Date | string) {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

export function isPast(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

// Helpers for form values: return ISO strings in appropriate calendar for display
export function toISOForInput(date: Date | string, locale: Locale = "fa"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  if (locale === "fa") {
    const j = toJalaali(gy, gm, gd);
    return `${j.jy}-${pad(j.jm)}-${pad(j.jd)}`;
  }
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}

export function formatDateShort(date: Date | string, locale: Locale = "fa") {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "fa") {
    const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    return `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;
  }
  return new Intl.DateTimeFormat("en-GB").format(d);
}
