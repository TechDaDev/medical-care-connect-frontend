import { clsx } from "../../utils/clsx";

interface Props {
  className?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };

export function AvatarFallback({ name, size = "md", className }: Props) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className={clsx(
        "rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm",
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
