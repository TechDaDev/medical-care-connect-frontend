import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { clsx } from "../../utils/clsx";

interface Props {
  variant?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const styles = {
  info: "bg-status-info-50 text-status-info-900 border-status-info-200",
  success: "bg-status-success-50 text-status-success-900 border-status-success-200",
  warning: "bg-status-warning-50 text-status-warning-900 border-status-warning-200",
  error: "bg-status-error-50 text-status-error-900 border-status-error-200",
};

export function Alert({ variant = "info", children, className }: Props) {
  const Icon = icons[variant];
  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-lg border p-4 text-sm",
        styles[variant],
        className
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}