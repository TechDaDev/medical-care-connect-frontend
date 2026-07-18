import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  disabled?: boolean;
}

const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };

export function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  disabled = false,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  if (!interactive) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
        {stars.map((s) => (
          <Star
            key={s}
            className={`${sizeMap[size]} ${
              s <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(s)}
          className={`${sizeMap[size]} transition-colors ${
            disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"
          }`}
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-full h-full ${
              s <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200 hover:fill-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
