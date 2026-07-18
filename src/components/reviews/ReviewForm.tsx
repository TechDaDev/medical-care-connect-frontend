import { useState } from "react";
import { useI18n } from "../../i18n";
import { Button } from "../common/Button";
import { Textarea } from "../common/Textarea";
import { Input } from "../common/Input";
import { StarRating } from "./StarRating";

interface ReviewFormProps {
  initialRating?: number;
  initialTitle?: string;
  initialBody?: string;
  initialAnonymous?: boolean;
  onSubmit: (data: { rating: number; title: string; body: string; is_anonymous: boolean }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function ReviewForm({
  initialRating = 0,
  initialTitle = "",
  initialBody = "",
  initialAnonymous = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}: ReviewFormProps) {
  const { t } = useI18n();
  const [rating, setRating] = useState(initialRating);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [isAnonymous, setIsAnonymous] = useState(initialAnonymous);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t("review.ratingRequired"));
      return;
    }
    setError("");
    onSubmit({ rating, title, body, is_anonymous: isAnonymous });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t("review.rating")}
        </label>
        <StarRating rating={rating} interactive onChange={setRating} size="lg" />
      </div>

      <Input
        label={t("review.title")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("review.titlePlaceholder")}
      />

      <Textarea
        label={t("review.body")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("review.bodyPlaceholder")}
        rows={4}
      />

      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        {t("review.postAnonymously")}
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting ? t("common.loading") : isEditing ? t("common.save") : t("review.submit")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
