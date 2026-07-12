import type { ReactNode } from "react";
import { clsx } from "../../utils/clsx";

interface Props {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: Props) {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-gray-200 shadow-sm",
        padding && "p-4 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
