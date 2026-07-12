import en from "./en.json";
import ar from "./ar.json";

export type Lang = "en" | "ar";
const STORAGE_KEY = "mcc_lang";

let currentLang: Lang = (localStorage.getItem(STORAGE_KEY) as Lang) || "en";

const dictionaries: Record<Lang, Record<string, string>> = { en, ar };

export function setLanguage(lang: Lang) {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function getLanguage(): Lang {
  return currentLang;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLang];
  let val = dict[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }
  return val;
}

// Init direction on load
document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
document.documentElement.lang = currentLang;
