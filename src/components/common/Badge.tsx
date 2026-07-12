import { clsx } from "../../utils/clsx";

interface Props {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  children: string;
}

const colors: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-gray-100 text-gray-800",
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
