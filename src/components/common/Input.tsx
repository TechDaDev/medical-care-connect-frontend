import type { InputHTMLAttributes } from "react";
import { clsx } from "../../utils/clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-status-error-300 text-slate-900 placeholder-slate-400 focus:border-status-error-500 focus:ring-status-error-500/20"
            : "border-slate-300 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500/20",
          className
        )}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-status-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}