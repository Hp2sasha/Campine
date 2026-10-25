"use client";

import { useMemo, useState, useEffect } from "react";
import {
  toJalaali,
  toGregorian,
  isValidJalali,
  pad2,
  jalaliToGregorianStr,
  gregorianToJalaliStr,
  toEnglishDigits,
} from "@/lib/jalali";

type Props = {
  name: string;
  defaultValue?: string; // Gregorian ISO YYYY-MM-DD
  required?: boolean;
  locale: "fa" | "en";
  label?: string;
  placeholder?: string;
  className?: string;
};

const jalaliMonthsFa = [
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

const jalaliMonthsEn = [
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

const fieldCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-500";

function gregorianToJalaliParts(greg: string | undefined) {
  if (!greg) return null;
  const en = toEnglishDigits(greg);
  const m = en.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const gy = Number(m[1]);
  const gm = Number(m[2]);
  const gd = Number(m[3]);
  if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return null;
  const j = toJalaali(gy, gm, gd);
  return j;
}

function daysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand: check leap
  // leap if jalCal(jy).leap === 0
  // quick check via try converting Esfand 30
  const g30 = toGregorian(jy, jm, 30);
  // if conversion yields valid, it's leap (30 days), otherwise 29
  // simpler: use jalCal logic directly imported
  try {
    // use toGregorian sanity: if jd=30 valid then month has 30
    // we can check isValidJalali
    return isValidJalali(jy, jm, 30) ? 30 : 29;
  } catch {
    return 29;
  }
}

export default function DateInput({
  name,
  defaultValue,
  required,
  locale,
  className,
  placeholder,
}: Props) {
  // For EN, just render native date input
  if (locale === "en") {
    return (
      <input
        type="date"
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        dir="ltr"
        className={className ?? fieldCls}
      />
    );
  }

  // FA: Jalali picker
  const initial = useMemo(() => {
    const j = gregorianToJalaliParts(defaultValue);
    if (j) return j;
    return null;
  }, [defaultValue]);

  const [jy, setJy] = useState<number | "">(initial?.jy ?? "");
  const [jm, setJm] = useState<number | "">(initial?.jm ?? "");
  const [jd, setJd] = useState<number | "">(initial?.jd ?? "");

  // Compute gregorian ISO for hidden input
  const gregorianISO = useMemo(() => {
    if (jy === "" || jm === "" || jd === "") return "";
    const jyN = Number(jy);
    const jmN = Number(jm);
    const jdN = Number(jd);
    if (!isValidJalali(jyN, jmN, jdN)) return "";
    const g = toGregorian(jyN, jmN, jdN);
    return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
  }, [jy, jm, jd]);

  // Years range: 1300-1410 plus current jalali year +-?
  const currentJ = toJalaali(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );
  const years = useMemo(() => {
    const start = 1395;
    const end = 1415;
    const arr: number[] = [];
    for (let y = start; y <= end; y++) arr.push(y);
    return arr;
  }, []);

  const months = jalaliMonthsFa;
  const daysMax = useMemo(() => {
    if (jy === "" || jm === "") return 31;
    return daysInJalaliMonth(Number(jy), Number(jm));
  }, [jy, jm]);

  // Keep day in range when month/year changes
  useEffect(() => {
    if (jd !== "" && Number(jd) > daysMax) {
      setJd(daysMax);
    }
  }, [daysMax, jd]);

  return (
    <div className={className ? undefined : "w-full"}>
      {/* Hidden input that actually submits Gregorian ISO */}
      <input type="hidden" name={name} value={gregorianISO} />

      <div className="flex gap-2" dir="rtl">
        {/* Day */}
        <select
          value={jd}
          onChange={(e) =>
            setJd(e.target.value === "" ? "" : Number(e.target.value))
          }
          required={required}
          className={`${fieldCls} flex-1`}
          aria-label="روز"
        >
          <option value="">{placeholder ?? "روز"}</option>
          {Array.from({ length: daysMax }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Month */}
        <select
          value={jm}
          onChange={(e) =>
            setJm(e.target.value === "" ? "" : Number(e.target.value))
          }
          required={required}
          className={`${fieldCls} flex-[1.6]`}
          aria-label="ماه"
        >
          <option value="">ماه</option>
          {months.map((m, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>

        {/* Year */}
        <select
          value={jy}
          onChange={(e) =>
            setJy(e.target.value === "" ? "" : Number(e.target.value))
          }
          required={required}
          className={`${fieldCls} flex-1`}
          aria-label="سال"
        >
          <option value="">سال</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Visible Jalali hint / gregorian hidden but show jalali string for accessibility */}
      <div className="mt-1 text-[11px] text-slate-400" dir="rtl">
        {gregorianISO ? (
          <>
            تاریخ انتخابی: {jy}/{pad2(Number(jm))}/{pad2(Number(jd))} شمسی
            <span className="mx-1 text-slate-300">•</span>
            <span dir="ltr" className="text-slate-400">
              {gregorianISO} میلادی
            </span>
          </>
        ) : (
          "تاریخ را به شمسی انتخاب کنید"
        )}
      </div>
    </div>
  );
}

// For search forms: similar but allows empty and submits jalali->gregorian on change?
export function SearchDateInput({
  name,
  defaultValue,
  locale,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  locale: "fa" | "en";
  placeholder?: string;
}) {
  if (locale === "en") {
    return (
      <input
        type="date"
        name={name}
        defaultValue={defaultValue ?? ""}
        dir="ltr"
        placeholder={placeholder}
        className={fieldCls}
      />
    );
  }

  // For FA search, defaultValue may be jalali string (YYYY-MM-DD with jalali year) or gregorian
  // Convert incoming defaultValue (which is from query param) to jalali parts
  const initial = useMemo(() => {
    if (!defaultValue) return null;
    const en = toEnglishDigits(defaultValue);
    // Detect if it's jalali (year 1300-1500) or gregorian
    const m = en.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    if (y >= 1300 && y <= 1500) {
      return { jy: y, jm: Number(m[2]), jd: Number(m[3]) };
    } else {
      // gregorian -> jalali
      const j = toJalaali(Number(m[1]), Number(m[2]), Number(m[3]));
      return j;
    }
  }, [defaultValue]);

  const [jy, setJy] = useState<number | "">(initial?.jy ?? "");
  const [jm, setJm] = useState<number | "">(initial?.jm ?? "");
  const [jd, setJd] = useState<number | "">(initial?.jd ?? "");

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = 1395; y <= 1415; y++) arr.push(y);
    return arr;
  }, []);

  const daysMax = useMemo(() => {
    if (jy === "" || jm === "") return 31;
    return daysInJalaliMonth(Number(jy), Number(jm));
  }, [jy, jm]);

  useEffect(() => {
    if (jd !== "" && Number(jd) > daysMax) setJd(daysMax);
  }, [daysMax, jd]);

  // Hidden input holds jalali ISO (YYYY-MM-DD) for server to convert;
  // we will also handle gregorian query via conversion, but we store as jalali string
  // On search, we want to send jalali string so that if user shares link, it's readable in fa.
  // Server will accept both.
  const jalaliISO = useMemo(() => {
    if (jy === "" || jm === "" || jd === "") return "";
    if (!isValidJalali(Number(jy), Number(jm), Number(jd))) return "";
    return `${jy}-${pad2(Number(jm))}-${pad2(Number(jd))}`;
  }, [jy, jm, jd]);

  return (
    <div className="w-full sm:w-auto">
      {/* This is the value sent as ?date= */}
      <input type="hidden" name={name} value={jalaliISO} />
      <div className="flex gap-2" dir="rtl">
        <select
          value={jd}
          onChange={(e) =>
            setJd(e.target.value === "" ? "" : Number(e.target.value))
          }
          className={fieldCls}
          aria-label="روز"
        >
          <option value="">{placeholder?.split(" ")[0] ?? "روز"}</option>
          {Array.from({ length: daysMax }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={jm}
          onChange={(e) =>
            setJm(e.target.value === "" ? "" : Number(e.target.value))
          }
          className={fieldCls + " min-w-[130px]"}
          aria-label="ماه"
        >
          <option value="">ماه</option>
          {jalaliMonthsFa.map((m, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={jy}
          onChange={(e) =>
            setJy(e.target.value === "" ? "" : Number(e.target.value))
          }
          className={fieldCls}
          aria-label="سال"
        >
          <option value="">سال</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
