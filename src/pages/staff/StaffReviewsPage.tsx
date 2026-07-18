import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../../i18n";
import { reviewsApi } from "../../api/reviews";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Select } from "../../components/common/Select";
import { Modal } from "../../components/common/Modal";
import { StarRating } from "../../components/reviews/StarRating";
import { getErrorMessage } from "../../utils/errors";
import { Flag, Shield, MessageSquare } from "lucide-react";
import type { ConsultationReview } from "../../types";

const statusOptions = [
  { value: "", label: "review.filterAll" },
  { value: "published", label: "review.statusPublished" },
  { value: "under_review", label: "review.statusUnderReview" },
  { value: "hidden", label: "review.statusHidden" },
  { value: "removed", label: "review.statusRemoved" },
];

const moderateOptions = [
  { value: "published", label: "review.publish" },
  { value: "hidden", label: "review.hide" },
  { value: "removed", label: "review.remove" },
];

const resolveOptions = [
  { value: "dismissed", label: "Dismissed" },
  { value: "content_hidden", label: "Content Hidden" },
  { value: "content_removed", label: "Content Removed" },
  { value: "reviewer_warned", label: "Reviewer Warned" },
  { value: "reviewer_suspended", label: "Reviewer Suspended" },
];

export function StaffReviewsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [moderateTarget, setModerateTarget] = useState<ConsultationReview | null>(null);
  const [moderateStatus, setModerateStatus] = useState("");
  const [moderateReason, setModerateReason] = useState("");
  const [tab, setTab] = useState<"reviews" | "reports">("reviews");
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [resolveValue, setResolveValue] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");

  const { data: reviewsData, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-reviews", statusFilter],
    queryFn: () => reviewsApi.listReviews(statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["staff-reports"],
    queryFn: () => reviewsApi.listReports({ resolved: "false" }),
    enabled: tab === "reports",
  });

  const moderateMut = useMutation({
    mutationFn: () =>
      reviewsApi.moderateReview(moderateTarget!.id, {
        status: moderateStatus,
        moderation_reason: moderateReason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-reviews"] });
      setModerateTarget(null);
      setModerateStatus("");
      setModerateReason("");
    },
  });

  const resolveMut = useMutation({
    mutationFn: () =>
      reviewsApi.resolveReport(resolveTarget.id, {
        resolution: resolveValue,
        resolution_notes: resolveNotes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-reports"] });
      setResolveTarget(null);
      setResolveValue("");
      setResolveNotes("");
    },
  });

  const reviews = reviewsData?.results || [];
  const reports = reportsData?.results || [];

  if (isLoading && tab === "reviews") return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("review.byStaff")}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("reviews")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "reviews" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          {t("review.reviews")}
        </button>
        <button
          onClick={() => setTab("reports")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "reports" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          {t("review.reportList")} {reports.length > 0 && `(${reports.length})`}
        </button>
      </div>

      {tab === "reviews" && (
        <>
          {/* Filters */}
          <div className="mb-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions.map((o) => ({ ...o, label: t(o.label) }))}
            />
          </div>

          {reviews.length === 0 ? (
            <EmptyState message={t("review.noReviews")} />
          ) : (
            <div className="space-y-4">
              {reviews.map((review: ConsultationReview) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm font-medium text-slate-900">
                        {review.reviewer_name}
                      </span>
                      <Badge variant={review.status === "published" ? "success" : "warning"}>
                        {review.status === "published" ? t("review.statusPublished") : review.status === "under_review" ? t("review.statusUnderReview") : review.status === "hidden" ? t("review.statusHidden") : t("review.statusRemoved")}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {review.title && (
                    <h4 className="font-medium text-slate-900 mb-1">{review.title}</h4>
                  )}
                  {review.body && (
                    <p className="text-sm text-slate-600 mb-2">{review.body}</p>
                  )}

                  {review.report_count !== undefined && review.report_count > 0 && (
                    <p className="text-xs text-red-500 mb-2">
                      {review.report_count} {t("review.reports")}
                    </p>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModerateTarget(review)}
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    {t("review.moderate")}
                  </Button>

                  {review.moderation_reason && (
                    <p className="text-xs text-slate-400 mt-2">
                      {t("review.moderationReason")}: {review.moderation_reason}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "reports" && (
        <>
          {reportsLoading ? <Spinner /> : reports.length === 0 ? (
            <EmptyState message="No Reports" />
          ) : (
            <div className="space-y-4">
              {reports.map((report: any) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="warning">{report.reason}</Badge>
                      <p className="text-sm text-slate-500 mt-1">{report.description}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setResolveTarget(report)}
                    disabled={!!report.resolved_at}
                  >
                    {t("review.reportResolve")}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Moderate Modal */}
      <Modal
        open={!!moderateTarget}
        onClose={() => setModerateTarget(null)}
        title={t("review.moderateAction")}
      >
        <div className="space-y-4">
          <Select
            value={moderateStatus}
            onChange={(e) => setModerateStatus(e.target.value)}
            options={moderateOptions}
          />
          <textarea
            value={moderateReason}
            onChange={(e) => setModerateReason(e.target.value)}
            placeholder={t("review.moderationReason")}
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModerateTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => moderateMut.mutate()}
              disabled={!moderateStatus || moderateMut.isPending}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Report Modal */}
      <Modal
        open={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        title={t("review.reportResolve")}
      >
        <div className="space-y-4">
          <Select
            value={resolveValue}
            onChange={(e) => setResolveValue(e.target.value)}
            options={resolveOptions}
          />
          <textarea
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            placeholder={t("review.resolutionNotes")}
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setResolveTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => resolveMut.mutate()}
              disabled={!resolveValue || resolveMut.isPending}
            >
              {t("review.resolution")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
