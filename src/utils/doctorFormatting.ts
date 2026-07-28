import type { MoneyAmount } from "../types";

export function formatDoctorMoney(money: MoneyAmount, locale: string): string {
  const formatLocale = locale === "ckb" ? "ku" : locale;
  const amount = Number(money.amount);
  if (!Number.isFinite(amount)) return `${money.amount} ${money.currency}`;
  try {
    return new Intl.NumberFormat(formatLocale, {
      style: "currency",
      currency: money.currency,
    }).format(amount);
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}

export function formatEstimatedResponse(
  minutes: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (minutes <= 30) return t("doctor.responseUnder30");
  if (minutes < 24 * 60) {
    return t("doctor.responseHours", { hours: Math.max(1, Math.round(minutes / 60)) });
  }
  return t("doctor.responseDays", { days: Math.max(1, Math.round(minutes / (24 * 60))) });
}
