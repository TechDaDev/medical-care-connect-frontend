import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag, MessageSquare, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../auth";
import { reviewsApi } from "../../api/reviews";
import { UserRole } from "../../types";
import type { ConsultationReview } from "../../types";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { AvatarFallback } from "../common/AvatarFallback";
import { Modal } from "../common/Modal";
import { Textarea } from "../common/Textarea";
import { StarRating } from "./StarRating";

interface ReviewCardProps {
  review: ConsultationReview;
  showActions?: boolean;
  onModerate?: (review: ConsultationReview) => void;
}

export function ReviewCard({ review, showActions = true, onModerate }: ReviewCardProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showReport, setShowReport] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [responseBody, setResponseBody] = useState("");
  const [reportReason, setReportReason] = useState("");

  const isPatientView = user?.role === UserRole.PATIENT;
  const isDoctorView = user?.role === UserRole.DOCTOR;
  const isStaffView = user?.role === UserRole.COORDINATOR || user?.role === UserRole.ADMINISTRATOR;
  const isMyReview = review.reviewer === user?.id;

  const reportMutation = useMutation({
    mutationFn: () => reviewsApi.reportReview(review.id, { reason: reportReason }),
    onSuccess: () => {
      setShowReport(false);
      setReportReason("");
    },
  });

  const responseMutation = useMutation({
    mutationFn: () => reviewsApi.respondToReview(review.id, responseBody),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor-reviews"] });
      setShowResponse(false);
      setResponseBody("");
    },
  });

  // Visible content based on status
  const isVisible = review.status === "published" || isStaffView || isMyReview;
  if (!isVisible) return null;

  const statusBadge = review.status !== "published" ? (
    <Badge variant="warning">{review.status}</Badge>
  ) : null;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {!review.is_anonymous && (
            <AvatarFallback name={review.reviewer_name} size="sm" />
          )}
          <div>
            <p className="font-medium text-sm text-slate-900">
              {review.is_anonymous ? t("review.anonymous") : review.reviewer_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-slate-400">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {statusBadge}
      </div>

      {review.title && (
        <h4 className="font-medium text-slate-900 mb-1">{review.title}</h4>
      )}
      {review.body && (
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{review.body}</p>
      )}

      {/* Doctor's response */}
      {review.response && (
        <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
          <p className="text-xs font-medium text-primary-700 mb-1">
            {t("review.doctorResponse")}
          </p>
          <p className="text-sm text-primary-800">{review.response.body}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          {!isMyReview && !isDoctorView && (
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
              {t("review.report")}
            </button>
          )}
          {isDoctorView && !review.has_response && (
            <button
              onClick={() => setShowResponse(true)}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("review.respond")}
            </button>
          )}
          {isStaffView && onModerate && (
            <button
              onClick={() => onModerate(review)}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
              {t("review.moderate")}
            </button>
          )}
          {isStaffView && review.report_count !== undefined && review.report_count > 0 && (
            <span className="text-xs text-red-500 ml-auto">
              {review.report_count} {t("review.reports")}
            </span>
          )}
        </div>
      )}

      {/* Report Modal */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title={t("review.reportTitle")}>
        <div className="space-y-4">
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t("review.selectReason")}</option>
            <option value="inappropriate">{t("review.reasonInappropriate")}</option>
            <option value="spam">{t("review.reasonSpam")}</option>
            <option value="fake">{t("review.reasonFake")}</option>
            <option value="conflict_of_interest">{t("review.reasonConflict")}</option>
            <option value="privacy_violation">{t("review.reasonPrivacy")}</option>
            <option value="other">{t("review.reasonOther")}</option>
          </select>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowReport(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => reportMutation.mutate()}
              disabled={!reportReason || reportMutation.isPending}
            >
              {t("review.submitReport")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Response Modal */}
      <Modal open={showResponse} onClose={() => setShowResponse(false)} title={t("review.respondToReview")}>
        <div className="space-y-4">
          <Textarea
            value={responseBody}
            onChange={(e) => setResponseBody(e.target.value)}
            placeholder={t("review.responsePlaceholder")}
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowResponse(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => responseMutation.mutate()}
              disabled={!responseBody.trim() || responseMutation.isPending}
            >
              {t("review.submitResponse")}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
