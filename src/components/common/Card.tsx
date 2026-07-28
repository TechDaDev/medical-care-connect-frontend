import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "../../utils/clsx";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
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
  ...props
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
      {...props}
    >
      {children}
    </div>
  );
}
