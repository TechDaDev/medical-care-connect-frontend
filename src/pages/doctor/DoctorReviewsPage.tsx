import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../../i18n";
import { useAuth } from "../../auth";
import { reviewsApi } from "../../api/reviews";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { StarRating } from "../../components/reviews/StarRating";
import { DoctorReputationCard } from "../../components/reviews/DoctorReputationCard";
import { getErrorMessage } from "../../utils/errors";
import { MessageSquare, ThumbsUp } from "lucide-react";
import type { ConsultationReview } from "../../types";

export function DoctorReviewsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: reputation, isLoading: repLoading } = useQuery({
    queryKey: ["doctor-reputation", user?.id],
    queryFn: () => reviewsApi.getDoctorReputation(user?.id || ""),
    enabled: !!user?.id,
  });

  const { data: reviewsData, isLoading, error, refetch } = useQuery({
    queryKey: ["doctor-reviews", user?.id],
    queryFn: () => reviewsApi.getDoctorReviews(user?.id || ""),
    enabled: !!user?.id,
  });

  const respondMut = useMutation({
    mutationFn: (params: { reviewId: string; body: string }) =>
      reviewsApi.respondToReview(params.reviewId, params.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor-reviews"] });
      qc.invalidateQueries({ queryKey: ["doctor-reputation"] });
      setRespondingTo(null);
      setResponseText("");
    },
  });

  if (isLoading || repLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const reviews = reviewsData?.results || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("review.reputation")}</h1>
      </div>

      {/* Reputation Summary */}
      <div className="mb-8">
        <DoctorReputationCard reputation={reputation ?? null} loading={repLoading} />
      </div>

      {/* Reviews List */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        {t("review.reviews")} ({reviews.length})
      </h2>

      {reviews.length === 0 ? (
        <EmptyState message={t("review.noReviews")} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review: ConsultationReview) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-slate-500">
                      {review.is_anonymous ? t("review.anonymous") : review.reviewer_name}
                    </span>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-slate-900">{review.title}</h4>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              {review.body && (
                <p className="text-sm text-slate-600 mb-3">{review.body}</p>
              )}

              {/* Existing response */}
              {review.response && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100 mb-3">
                  <p className="text-xs font-medium text-primary-700 mb-1">
                    {t("review.doctorResponse")}
                  </p>
                  <p className="text-sm text-primary-800">{review.response.body}</p>
                </div>
              )}

              {/* Respond button / form */}
              {!review.has_response && respondingTo !== review.id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRespondingTo(review.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {t("review.respond")}
                </Button>
              )}

              {respondingTo === review.id && (
                <div className="space-y-3">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder={t("review.responsePlaceholder")}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondMut.mutate({ reviewId: review.id, body: responseText })}
                      disabled={!responseText.trim() || respondMut.isPending}
                    >
                      {t("review.submitResponse")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRespondingTo(null); setResponseText(""); }}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
