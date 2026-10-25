/**
 * Jalali (Shamsi) ↔ Gregorian conversion
 * Wraps jalaali-js (proven Borkowski algorithm)
 */

import {
  toJalaali as _toJalaali,
  toGregorian as _toGregorian,
  isValidJalaaliDate as _isValid,
  isLeapJalaaliYear,
  jalaaliMonthLength,
} from "jalaali-js";

export type JalaliDate = { jy: number; jm: number; jd: number };
export type GregorianDate = { gy: number; gm: number; gd: number };

export function toJalaali(gy: number, gm: number, gd: number): JalaliDate {
  return _toJalaali(gy, gm, gd) as JalaliDate;
}

export function toGregorian(jy: number, jm: number, jd: number): GregorianDate {
  return _toGregorian(jy, jm, jd) as GregorianDate;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
export const englishDigits = "0123456789";

export function toEnglishDigits(s: string): string {
  let out = "";
  for (const ch of s) {
    const idx = persianDigits.indexOf(ch);
    if (idx !== -1) out += String(idx);
    else {
      const idx2 = "٠١٢٣٤٥٦٧٨٩".indexOf(ch);
      if (idx2 !== -1) out += String(idx2);
      else out += ch;
    }
  }
  return out;
}

export function toPersianDigits(s: string): string {
  let out = "";
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") out += persianDigits[ch.charCodeAt(0) - 48];
    else out += ch;
  }
  return out;
}

export function jalaliToGregorianStr(jalali: string): string | null {
  const en = toEnglishDigits(jalali.trim());
  const m = en.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (!m) return null;
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (!isValidJalali(jy, jm, jd)) return null;
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
}

export function gregorianToJalaliStr(gregorian: string): string | null {
  const en = toEnglishDigits(gregorian.trim());
  const m = en.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const gy = Number(m[1]);
  const gm = Number(m[2]);
  const gd = Number(m[3]);
  if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;
  const j = toJalaali(gy, gm, gd);
  return `${j.jy}-${pad2(j.jm)}-${pad2(j.jd)}`;
}

export function isValidJalali(jy: number, jm: number, jd: number): boolean {
  return _isValid(jy, jm, jd);
}

export function isJalaliDateString(s: string): boolean {
  const en = toEnglishDigits(s.trim());
  const m = en.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  return y >= 1300 && y <= 1500;
}

export function isGregorianDateString(s: string): boolean {
  const en = toEnglishDigits(s.trim());
  const m = en.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  return y >= 1900 && y <= 2100;
}

export function normalizeToGregorian(input: string): string | null {
  if (!input) return null;
  const t = toEnglishDigits(input.trim());
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const y = Number(t.slice(0, 4));
    if (y >= 1300 && y <= 1500) {
      return jalaliToGregorianStr(t);
    }
    return t;
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(t)) {
    return jalaliToGregorianStr(t.replace(/\//g, "-"));
  }
  return null;
}

export function formatJalaliDate(d: Date): string {
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}

export function formatJalaliLong(d: Date, locale: "fa" | "en" = "fa"): string {
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthNamesFa = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];
  const monthNamesEn = [
    "Farvardin",
    "Ordibehesht",
    "Khordad",
    "Tir",
    "Mordad",
    "Shahrivar",
    "Mehr",
    "Aban",
    "Azar",
    "Dey",
    "Bahman",
    "Esfand",
  ];
  const months = locale === "fa" ? monthNamesFa : monthNamesEn;
  return `${j.jd} ${months[j.jm - 1]} ${j.jy}`;
}

export function gregorianISOToJalaliISO(iso: string): string | null {
  return gregorianToJalaliStr(iso);
}

export function jalaliISOToGregorianISO(iso: string): string | null {
  return jalaliToGregorianStr(iso);
}

export function jalaliStringToDate(jalaliStr: string): Date | null {
  const g = jalaliToGregorianStr(jalaliStr);
  if (!g) return null;
  return new Date(g + "T00:00:00");
}

export function gregorianStringToDate(gregStr: string): Date | null {
  const t = toEnglishDigits(gregStr.trim());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return new Date(t + "T00:00:00");
}

export function daysInJalaliMonth(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

export { isLeapJalaaliYear };
