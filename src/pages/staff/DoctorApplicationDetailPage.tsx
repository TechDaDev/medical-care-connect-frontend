import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { staffApi } from "../../api/staff";
import { useI18n } from "../../i18n";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { getErrorMessage } from "../../utils/errors";
import type { DoctorApplicationDetail } from "../../types/staff";

function ReviewDialog({
  action,
  detail,
  onClose,
  onSubmit,
  isPending,
}: {
  action: "approve" | "reject" | "suspend" | "reactivate";
  detail: DoctorApplicationDetail;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const requiresReason = action === "reject" || action === "suspend" || action === "reactivate";
  const maxLength = 500;

  const handleSubmit = () => {
    if (requiresReason && !reason.trim()) {
      setError(t("reviewDialog.reject.reasonRequired"));
      return;
    }
    onSubmit(reason.trim());
  };

  const titleKey = `reviewDialog.${action}.title`;
  const confirmKey = `reviewDialog.${action}.confirm`;
  const reasonKey = `reviewDialog.${action}.reason`;
  const submitKey = `reviewDialog.${action}.submit`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-dialog-title"
      aria-describedby="review-dialog-desc"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="review-dialog-title" className="text-lg font-bold text-gray-900 mb-2">
          {t(titleKey)}
        </h2>
        <p id="review-dialog-desc" className="text-sm text-gray-600 mb-4">
          {t(confirmKey, { name: detail.full_name })}
        </p>

        {action === "suspend" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
            {t("reviewDialog.suspend.confirm")}
          </div>
        )}

        {requiresReason && (
          <div className="mb-4">
            <label htmlFor="review-reason" className="block text-sm font-medium text-gray-700 mb-1">
              {t(reasonKey)}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="review-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value.slice(0, maxLength));
                setError("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              maxLength={maxLength}
              placeholder={t(`reviewDialog.${action}.reasonHint` || "")}
              aria-required={requiresReason}
            />
            <div className="flex justify-between mt-1">
              {error && <p className="text-xs text-red-500">{error}</p>}
              <p className="text-xs text-gray-400 ml-auto">
                {t("reviewDialog.characterCount", {
                  count: reason.length,
                  max: maxLength,
                })}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            {t("actions.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            variant={action === "approve" || action === "reactivate" ? "primary" : "danger"}
          >
            {isPending ? t("reviewDialog.submitting") : t(submitKey)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DoctorApplicationDetailPage() {
  const { t } = useI18n();
  const { profileId } = useParams<{ profileId: string }>();
  const queryClient = useQueryClient();
  const [activeDialog, setActiveDialog] = useState<"approve" | "reject" | "suspend" | "reactivate" | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "error">("idle");
  const [downloadError, setDownloadError] = useState("");

  const {
    data: detail,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["staff-doctor-application", profileId],
    queryFn: () => staffApi.doctorApplicationDetail(profileId!),
    enabled: !!profileId,
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { action: "approve" | "reject" | "suspend" | "reactivate"; reason: string; expected_status: "pending" | "approved" | "rejected" | "suspended" }) =>
      staffApi.reviewDoctorApplication(profileId!, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["staff-doctor-application", profileId], updated);
      queryClient.invalidateQueries({ queryKey: ["staff-doctor-applications"] });
      queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
      setActiveDialog(null);
    },
  });

  const handleReview = (action: "approve" | "reject" | "suspend" | "reactivate", reason: string) => {
    reviewMutation.mutate({
      action,
      reason,
      expected_status: (detail?.approval_status || "pending") as "pending" | "approved" | "rejected" | "suspended",
    });
  };

  const handleDownload = async () => {
    if (!profileId) return;
    setDownloadState("loading");
    setDownloadError("");
    try {
      const response = await staffApi.downloadDoctorLicense(profileId);
      const disposition = response.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match?.[1] || `license-${profileId}.pdf`;
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloadState("idle");
    } catch (err: any) {
      setDownloadState("error");
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (code === "document_quarantined") {
        setDownloadError(t("doctorApplication.detail.documentQuarantined"));
      } else if (status === 404 || code === "document_unavailable") {
        setDownloadError(t("doctorApplication.detail.documentUnavailable"));
      } else {
        setDownloadError(getErrorMessage(err));
      }
    }
  };

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <ErrorState
        message={`${t("doctorApplication.detail.notFound")}: ${getErrorMessage(error)}`}
        onRetry={refetch}
      />
    );
  if (!detail) return null;

  const statusBadgeClass = (s: string) => {
    switch (s) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/app/staff/doctor-applications"
            className="text-sm text-primary-600 hover:underline mb-1 inline-block"
          >
            &larr; {t("doctorApplications.title")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("doctorApplication.detail.title")}
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {t("doctorApplications.retry")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t("doctorApplication.detail.section.identity")}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.fullName")}</dt>
                <dd className="font-medium text-gray-900">{detail.full_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.email")}</dt>
                <dd className="text-gray-900">{detail.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.phone")}</dt>
                <dd className="text-gray-900">{detail.phone_number || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.languages")}</dt>
                <dd className="text-gray-900">
                  {detail.languages?.length ? detail.languages.join(", ") : "-"}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Professional */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t("doctorApplication.detail.section.professional")}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.specialty")}</dt>
                <dd className="font-medium text-gray-900">
                  {detail.specialty_name || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.titleField")}</dt>
                <dd className="text-gray-900">{detail.professional_title || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.workplace")}</dt>
                <dd className="text-gray-900">{detail.workplace_name || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.experience")}</dt>
                <dd className="text-gray-900">{detail.years_of_experience}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.fee")}</dt>
                <dd className="text-gray-900">
                  {detail.consultation_fee ? `${detail.consultation_fee}` : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("doctorApplication.detail.responseTime")}</dt>
                <dd className="text-gray-900">
                  {detail.estimated_response_minutes
                    ? `${detail.estimated_response_minutes} min`
                    : "-"}
                </dd>
              </div>
              {detail.biography && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">{t("doctorApplication.detail.biography")}</dt>
                  <dd className="text-gray-900 whitespace-pre-wrap">{detail.biography}</dd>
                </div>
              )}
              {detail.qualifications && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">{t("doctorApplication.detail.qualifications")}</dt>
                  <dd className="text-gray-900 whitespace-pre-wrap">{detail.qualifications}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t("doctorApplication.detail.section.status")}
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadgeClass(detail.approval_status)}`}
                >
                  {t(`doctorApplications.status.${detail.approval_status}`)}
                </span>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">
                  {t("doctorApplication.detail.submittedAt")}
                </dt>
                <dd className="text-gray-900">
                  {new Date(detail.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">
                  {t("doctorApplication.detail.updatedAt")}
                </dt>
                <dd className="text-gray-900">
                  {new Date(detail.updated_at).toLocaleDateString()}
                </dd>
              </div>
              {detail.approval_note && (
                <div>
                  <dt className="text-gray-500 text-xs">Note</dt>
                  <dd className="text-gray-900 italic">{detail.approval_note}</dd>
                </div>
              )}
            </div>
          </Card>

          {/* License */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t("doctorApplication.detail.section.license")}
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500 text-xs">
                  {t("doctorApplication.detail.licenseNumber")}
                </dt>
                <dd className="text-gray-900 font-mono">
                  {detail.license_number_masked || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Status</dt>
                <dd>
                  {detail.has_license_document ? (
                    <span className="text-green-600">
                      {t("doctorApplications.document.present")}
                      {detail.license_document_verified && (
                        <span className="ml-1">
                          · {t("doctorApplication.detail.licenseVerified")}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      {t("doctorApplications.document.missing")}
                    </span>
                  )}
                </dd>
              </div>
              {detail.has_license_document && (
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloadState === "loading"}
                    aria-label={t("doctorApplication.detail.downloadLicense")}
                  >
                    {downloadState === "loading"
                      ? t("doctorApplication.detail.downloading")
                      : t("doctorApplication.detail.downloadLicense")}
                  </Button>
                  {downloadState === "error" && (
                    <p className="text-xs text-red-500 mt-1" role="alert">
                      {downloadError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t("doctorApplication.detail.actions")}
            </h2>
            {detail.available_actions.length === 0 ? (
              <p className="text-sm text-gray-400">
                {t("doctorApplication.detail.noActions")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {detail.available_actions.map((action) => {
                  const btnVariant =
                    action === "approve" || action === "reactivate"
                      ? "primary"
                      : "danger";
                  const btnLabel =
                    action === "approve"
                      ? t("reviewDialog.approve.submit")
                      : action === "reject"
                        ? t("reviewDialog.reject.submit")
                        : action === "suspend"
                          ? t("reviewDialog.suspend.submit")
                          : t("reviewDialog.reactivate.submit");
                  return (
                    <Button
                      key={action}
                      variant={btnVariant}
                      size="sm"
                      onClick={() =>
                        setActiveDialog(
                          action as "approve" | "reject" | "suspend" | "reactivate"
                        )
                      }
                      aria-haspopup="dialog"
                    >
                      {btnLabel}
                    </Button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {activeDialog && (
        <ReviewDialog
          action={activeDialog}
          detail={detail}
          onClose={() => setActiveDialog(null)}
          onSubmit={(reason) => handleReview(activeDialog, reason)}
          isPending={reviewMutation.isPending}
        />
      )}

      {/* Error */}
      {reviewMutation.isError && (
        <div
          className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md"
          role="alert"
        >
          <p className="text-sm font-medium">
            {(reviewMutation.error as any)?.response?.data?.code === "application_state_changed"
              ? t("reviewDialog.conflict")
              : t("reviewDialog.error")}
          </p>
          <p className="text-xs mt-1">
            {getErrorMessage(reviewMutation.error)}
          </p>
        </div>
      )}

      {/* Success */}
      {reviewMutation.isSuccess && (
        <div
          className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md"
          role="status"
        >
          <p className="text-sm font-medium">{t("reviewDialog.success")}</p>
        </div>
      )}
    </div>
  );
}
