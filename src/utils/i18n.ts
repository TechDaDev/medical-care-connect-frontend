import en from "./en.json";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";
import en_extra from "../locales/en.json";

export type Lang = "ar" | "en" | "ckb";
const STORAGE_KEY = "mcc_lang";

// Fallback chain: stored → ar
let stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
if (stored && !["ar", "en", "ckb"].includes(stored)) stored = null;
let currentLang: Lang = stored || "ar";

const dictionaries: Record<string, Record<string, string>> = {
  ar,
  en: { ...en, ...en_extra },
  ckb,
};

const RTL_LANGS: Record<string, boolean> = { ar: true, ckb: true, en: false };

export function setLanguage(lang: Lang) {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  const isRtl = RTL_LANGS[lang] || false;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function getLanguage(): Lang {
  return currentLang;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLang] || dictionaries.ar;
  let val = dict[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }
  return val;
}

// Init direction on load
const initialRtl = RTL_LANGS[currentLang] || false;
document.documentElement.dir = initialRtl ? "rtl" : "ltr";
document.documentElement.lang = currentLang;
