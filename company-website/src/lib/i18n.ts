import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import he from "@/locales/he.json";
export const locales = ["en","ar","he"] as const;
export type Locale = (typeof locales)[number];
export const dictionaries = { en, ar, he };
export const isRtl = (locale: Locale) => locale === "ar" || locale === "he";
export function localeOf(value?: string): Locale { return locales.includes(value as Locale) ? value as Locale : "en"; }
