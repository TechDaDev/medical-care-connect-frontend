import { clsx } from "../../utils/clsx";

interface Props {
  className?: string;
}

export function FormField({ className, children }: React.PropsWithChildren<Props>) {
  return <div className={clsx("space-y-1", className)}>{children}</div>;
}
