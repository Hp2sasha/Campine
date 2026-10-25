import { cookies } from "next/headers";
import { fa, en } from "./dictionaries";

export type Dict = typeof fa;
export type Locale = "fa" | "en";

export function getLocale(): Locale {
  const c = cookies().get("locale")?.value;
  return c === "en" ? "en" : "fa";
}

export function getDict(): Dict {
  return getLocale() === "en" ? en : fa;
}

export function getDir(locale: Locale = getLocale()): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "fa" ? "en" : "fa";
}
