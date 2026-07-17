import { clsx } from "../../utils/clsx";

interface Props {
  variant?:
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "primary"
    | "medical";
  children: string;
}

const colors: Record<string, string> = {
  success: "bg-status-success-100 text-status-success-800",
  warning: "bg-status-warning-100 text-status-warning-800",
  danger: "bg-status-error-100 text-status-error-800",
  info: "bg-status-info-100 text-status-info-800",
  neutral: "bg-slate-100 text-slate-800",
  primary: "bg-primary-100 text-primary-800",
  medical: "bg-medical-teal-100 text-medical-teal-800",
};

export function Badge({ variant = "neutral", children }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[variant]
      )}
    >
      {children}
    </span>
  );
}