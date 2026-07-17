/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import en_base from "../utils/en.json";
import ar_base from "../utils/ar.json";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";
import en_extra from "../locales/en.json";

export type SupportedLocale = "ar" | "en" | "ckb";

const STORAGE_KEY = "mcc_lang";

const dictionaries: Record<string, Record<string, string>> = {
  ar: { ...ar_base, ...ar },
  en: { ...en_base, ...en_extra },
  ckb,
};

const RTL_LANGS: Record<string, boolean> = { ar: true, ckb: true, en: false };

function getInitialLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (stored && ["ar", "en", "ckb"].includes(stored)) return stored;
  } catch {
    /* localStorage not available */
  }
  return "ar";
}

function applyHtmlAttrs(locale: SupportedLocale) {
  const isRtl = RTL_LANGS[locale] || false;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = locale;
}

export interface I18nContextValue {
  locale: SupportedLocale;
  direction: "rtl" | "ltr";
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (dateStr: string) => string;
  formatDateTime: (dateStr: string) => string;
  formatNumber: (n: number) => string;
  formatFileSize: (bytes: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale);

  useEffect(() => {
    applyHtmlAttrs(locale);
  }, [locale]);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      /* localStorage not available */
    }
    applyHtmlAttrs(newLocale);
  }, []);

  const t: I18nContextValue["t"] = useCallback(
    (key, params) => {
      const dict = dictionaries[locale] || dictionaries.ar;
      let val = dict[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          val = val.replace(`{${k}}`, String(v));
        });
      }
      return val;
    },
    [locale]
  );

  const localeForFormat = locale === "ckb" ? "ku" : locale;

  const formatDate = useCallback(
    (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(localeForFormat, {
          year: "numeric", month: "short", day: "numeric",
        });
      } catch {
        return dateStr;
      }
    },
    [localeForFormat]
  );

  const formatDateTime = useCallback(
    (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(localeForFormat, {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
      } catch {
        return dateStr;
      }
    },
    [localeForFormat]
  );

  const formatNumber = useCallback(
    (n: number) => {
      try {
        return new Intl.NumberFormat(localeForFormat).format(n);
      } catch {
        return String(n);
      }
    },
    [localeForFormat]
  );

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
    return `${size} ${units[i]}`;
  }, []);

  const formatCurrency = useCallback(
    (amount: number, currency = "USD") => {
      try {
        return new Intl.NumberFormat(localeForFormat, {
          style: "currency", currency,
        }).format(amount);
      } catch {
        return `${amount} ${currency}`;
      }
    },
    [localeForFormat]
  );

  const direction = RTL_LANGS[locale] ? "rtl" : "ltr";

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction,
      setLocale,
      t,
      formatDate,
      formatDateTime,
      formatNumber,
      formatFileSize,
      formatCurrency,
    }),
    [locale, direction, setLocale, t, formatDate, formatDateTime, formatNumber, formatFileSize, formatCurrency]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
