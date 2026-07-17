import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "../../utils/clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  className,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
        variant === "secondary" &&
          "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400",
        variant === "outline" &&
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
        variant === "danger" &&
          "bg-status-error-600 text-white hover:bg-status-error-700 focus:ring-status-error-500",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 focus:ring-slate-400",
        size === "sm" && "px-3 py-1.5 text-sm gap-1.5",
        size === "md" && "px-4 py-2 text-sm gap-2",
        size === "lg" && "px-6 py-3 text-base gap-2",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <SpinnerSmall />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function SpinnerSmall() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}