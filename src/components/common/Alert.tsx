import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { clsx } from "../../utils/clsx";

interface Props {
  variant?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const styles = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export function Alert({ variant = "info", children }: Props) {
  const Icon = icons[variant];
  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-lg border p-4 text-sm",
        styles[variant]
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}
