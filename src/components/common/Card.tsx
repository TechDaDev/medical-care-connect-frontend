import type { ReactNode } from "react";
import { clsx } from "../../utils/clsx";

interface Props {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  bordered?: boolean;
}

export function Card({
  children,
  className,
  padding = true,
  hover = false,
  bordered = true,
}: Props) {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl transition-all duration-200",
        bordered && "border border-slate-200",
        padding && "p-4 sm:p-6",
        hover && "hover:shadow-lg hover:border-primary-200 cursor-pointer",
        "shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}