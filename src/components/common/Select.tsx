import type { SelectHTMLAttributes } from "react";
import { clsx } from "../../utils/clsx";

interface Option {
  value: string;
  label: string;
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}: Props) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-status-error-300 focus:border-status-error-500 focus:ring-status-error-500/20"
            : "border-slate-300 focus:border-primary-500 focus:ring-primary-500/20",
          className
        )}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-status-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}