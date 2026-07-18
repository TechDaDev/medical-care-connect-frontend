import { Star, TrendingUp, TrendingDown, Minus, MessageSquare } from "lucide-react";
import { useI18n } from "../../i18n";
import { Card } from "../common/Card";
import { StarRating } from "./StarRating";
import type { DoctorReputation } from "../../types";

interface DoctorReputationCardProps {
  reputation: DoctorReputation | null;
  loading?: boolean;
}

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "improving":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "declining":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-slate-400" />;
  }
}

const trendLabels: Record<string, string> = {
  improving: "review.trendImproving",
  declining: "review.trendDeclining",
  stable: "review.trendStable",
  no_reviews: "review.noReviews",
};

export function DoctorReputationCard({ reputation, loading }: DoctorReputationCardProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-3" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </Card>
    );
  }

  if (!reputation || reputation.total_reviews === 0) {
    return (
      <Card className="p-5 text-center">
        <Star className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{t("review.noReviewsYet")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">
              {reputation.average_rating.toFixed(1)}
            </span>
            <StarRating rating={Math.round(reputation.average_rating)} size="sm" />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {reputation.total_reviews} {t("review.reviews")}
            </span>
            <span className="flex items-center gap-1">
              <TrendIcon trend={reputation.recent_ratings_trend} />
              {t(trendLabels[reputation.recent_ratings_trend] || "review.trendStable")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <MessageSquare className="h-4 w-4" />
            <span>{reputation.response_rate}% {t("review.responseRate")}</span>
          </div>
        </div>
      </div>

      {/* Rating distribution bars */}
      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reputation.rating_distribution[String(star)] || 0;
          const pct = reputation.total_reviews > 0
            ? (count / reputation.total_reviews) * 100
            : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-slate-500 text-right">{star}★</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-slate-400">{count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
