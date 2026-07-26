import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useI18n } from "../../i18n";
import { privacyAdminApi } from "../../api/privacyAdmin";
import type { PrivacyDeletionAction } from "../../types/staff";
import { clsx } from "../../utils/clsx";
import { ApiRequestError } from "../../utils/errors";

const statusBadgeColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  processing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
};

function ConfirmDialog({
  action,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  isPending,
  error,
}: {
  action: PrivacyDeletionAction;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const { t } = useI18n();
  const isReject = action === "reject";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 id="dialog-title" className="text-lg font-bold text-slate-900 mb-2">
          {isReject ? t("privacyRequests.rejectRequest") : t("privacyRequests.approveRequest")}
        </h3>
        <div className="flex items-start gap-3 mb-4 p-3 bg-amber-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">{t("privacyRequests.irreversibleAction")}</p>
        </div>
        {isReject && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("privacyRequests.decisionReason")}</label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              rows={3}
              maxLength={500}
              required={isReject}
              aria-label={t("privacyRequests.decisionReason")}
            />
            <p className="text-xs text-slate-400 mt-1">{reason.length}/500</p>
          </div>
        )}
        {error && <p className="text-sm text-red-600 mb-3" role="alert">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={isPending} className="px-4 py-2 border rounded-lg text-sm">
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending || (isReject && reason.length < 10)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm text-white",
              isReject ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
              "disabled:opacity-50"
            )}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
            {isReject ? t("privacyRequests.rejectRequest") : t("privacyRequests.approveRequest")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyRequestDetailPage() {
  const { t } = useI18n();
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogAction, setDialogAction] = useState<PrivacyDeletionAction | null>(null);
  const [reason, setReason] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["privacy-deletion-request", requestId],
    queryFn: () => privacyAdminApi.deletionRequestDetail(requestId!),
    enabled: !!requestId,
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { action: PrivacyDeletionAction; reason?: string }) =>
      privacyAdminApi.reviewDeletionRequest(requestId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privacy-deletion-requests"] });
      queryClient.invalidateQueries({ queryKey: ["privacy-deletion-request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
      setDialogAction(null);
      setReason("");
      setDialogError(null);
    },
    onError: (err: unknown) => {
      const code = err instanceof ApiRequestError ? err.data.code : undefined;
      if (code === "request_state_changed" || code === "invalid_privacy_request_transition") {
        setDialogError(t("privacyRequests.stateChangedConcurrently"));
        queryClient.invalidateQueries({ queryKey: ["privacy-deletion-request", requestId] });
      } else {
        setDialogError(
          err instanceof ApiRequestError
            ? err.data.detail || t("privacyRequests.errorUpdating")
            : t("privacyRequests.errorUpdating"),
        );
      }
    },
  });

  if (isLoading) return <div className="text-center py-8 text-slate-500" role="status" aria-busy="true">{t("privacyRequests.loading")}</div>;
  if (isError || !data) return (
    <div className="text-center py-8" role="alert">
      <p className="text-red-600">{t("privacyRequests.errorLoadingDetail")}</p>
    </div>
  );

  const d = data;
  const statusLabel = t(`privacyRequests.${d.status}`);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate("/app/staff/privacy-requests")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">{t("privacyRequests.title")}</h1>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className={clsx("px-3 py-1 rounded-full text-sm font-medium", statusBadgeColors[d.status] || "")}>{statusLabel}</span>
      </div>

      {/* Section A: Requester */}
      <section className="bg-white rounded-xl p-6 border border-slate-200" aria-label={t("privacyRequests.sectionRequester")}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("privacyRequests.sectionRequester")}</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-500">{t("adminUsers.fullName")}</dt><dd className="font-medium">{d.requester.full_name}</dd></div>
          <div><dt className="text-slate-500">{t("adminUsers.email")}</dt><dd className="font-medium">{d.requester.email}</dd></div>
          <div><dt className="text-slate-500">{t("adminUsers.role")}</dt><dd className="font-medium">{t(`privacyRequests.role${d.requester.role.charAt(0).toUpperCase() + d.requester.role.slice(1)}`)}</dd></div>
        </dl>
      </section>

      {/* Section B: Request */}
      <section className="bg-white rounded-xl p-6 border border-slate-200" aria-label={t("privacyRequests.sectionRequest")}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("privacyRequests.sectionRequest")}</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-500">{t("privacyRequests.requestId")}</dt><dd className="font-medium font-mono text-xs">{d.id}</dd></div>
          <div><dt className="text-slate-500">{t("privacyRequests.createdDate")}</dt><dd className="font-medium">{new Date(d.requested_at).toLocaleString()}</dd></div>
          {d.request_reason_summary && <div className="col-span-2"><dt className="text-slate-500">{t("privacyRequests.requestReason")}</dt><dd className="font-medium mt-1">{d.request_reason_summary}</dd></div>}
        </dl>
      </section>

      {/* Section C: Related Data */}
      <section className="bg-white rounded-xl p-6 border border-slate-200" aria-label={t("privacyRequests.sectionRelatedData")}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("privacyRequests.sectionRelatedData")}</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xl font-bold text-slate-900">{d.related_data_summary.consultations}</div><div className="text-xs text-slate-500">{t("privacyRequests.consultations")}</div></div>
          <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xl font-bold text-slate-900">{d.related_data_summary.messages}</div><div className="text-xs text-slate-500">{t("privacyRequests.messages")}</div></div>
          <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xl font-bold text-slate-900">{d.related_data_summary.attachments}</div><div className="text-xs text-slate-500">{t("privacyRequests.attachments")}</div></div>
          <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xl font-bold text-slate-900">{d.related_data_summary.notifications}</div><div className="text-xs text-slate-500">{t("privacyRequests.notifications")}</div></div>
        </div>
        {d.export_request && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm">
            <span className="text-slate-500">{t("privacyRequests.exportRequest")}:</span> {d.export_request.status}
          </div>
        )}
      </section>

      {/* Section D: Decision */}
      {(d.status === "approved" || d.status === "rejected") && (
        <section className="bg-white rounded-xl p-6 border border-slate-200" aria-label={t("privacyRequests.sectionDecision")}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("privacyRequests.sectionDecision")}</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {d.reviewed_by_info && <div><dt className="text-slate-500">{t("privacyRequests.reviewedBy")}</dt><dd className="font-medium">{d.reviewed_by_info.full_name}</dd></div>}
            <div><dt className="text-slate-500">{t("privacyRequests.decidedDate")}</dt><dd className="font-medium">{d.reviewed_at ? new Date(d.reviewed_at).toLocaleString() : "-"}</dd></div>
            {d.rejection_reason && <div className="col-span-2"><dt className="text-slate-500">{t("privacyRequests.decisionReason")}</dt><dd className="font-medium mt-1">{d.rejection_reason}</dd></div>}
          </dl>
        </section>
      )}

      {/* Section E: Execution */}
      {(d.status === "processing" || d.status === "completed" || d.status === "failed") && (
        <section className="bg-white rounded-xl p-6 border border-slate-200" aria-label={t("privacyRequests.sectionExecution")}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("privacyRequests.sectionExecution")}</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {d.completed_at && <div><dt className="text-slate-500">{t("privacyRequests.completionDate")}</dt><dd className="font-medium">{new Date(d.completed_at).toLocaleString()}</dd></div>}
            {d.failure_code && <div><dt className="text-slate-500">{t("privacyRequests.failureCode")}</dt><dd className="font-medium text-red-600">{d.failure_code}</dd></div>}
          </dl>
        </section>
      )}

      {/* Section F: Actions */}
      {d.available_actions.length > 0 && (
        <section className="bg-white rounded-xl p-6 border border-slate-200" aria-label={t("privacyRequests.sectionActions")}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("privacyRequests.sectionActions")}</h2>
          <div className="flex gap-3">
            {d.available_actions.includes("approve") && (
              <button onClick={() => setDialogAction("approve")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <CheckCircle className="h-4 w-4" /> {t("privacyRequests.approveRequest")}
              </button>
            )}
            {d.available_actions.includes("reject") && (
              <button onClick={() => setDialogAction("reject")} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                <XCircle className="h-4 w-4" /> {t("privacyRequests.rejectRequest")}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Dialog */}
      {dialogAction && (
        <ConfirmDialog
          action={dialogAction}
          reason={reason}
          onReasonChange={setReason}
          onConfirm={() => reviewMutation.mutate({ action: dialogAction, reason: dialogAction === "reject" ? reason : undefined })}
          onCancel={() => { setDialogAction(null); setReason(""); setDialogError(null); }}
          isPending={reviewMutation.isPending}
          error={dialogError}
        />
      )}
    </div>
  );
}
