import { clsx } from "../../utils/clsx";

interface Props {
  className?: string;
  count?: number;
}

export function Skeleton({ className }: Props) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200 rounded",
        className || "h-4 w-full"
      )}
    />
  );
}
