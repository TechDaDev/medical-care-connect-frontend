import { getLanguage } from "./i18n";

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const lang = getLanguage();
    return d.toLocaleDateString(lang === "ckb" ? "ku" : lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const lang = getLanguage();
    return d.toLocaleDateString(lang === "ckb" ? "ku" : lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function formatNumber(n: number): string {
  try {
    const lang = getLanguage();
    return new Intl.NumberFormat(lang === "ckb" ? "ku" : lang).format(n);
  } catch {
    return String(n);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    const lang = getLanguage();
    return new Intl.NumberFormat(lang === "ckb" ? "ku" : lang, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
