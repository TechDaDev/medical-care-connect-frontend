import { useState, useRef, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useI18n } from "../../i18n";
import { staffApi } from "../../api/staff";
import type { AdminUserAction } from "../../types/staff";
import { clsx } from "../../utils/clsx";
import { ApiRequestError } from "../../utils/errors";

function ActionButton({
  action,
  onClick,
  disabled,
  variant = "default",
}: {
  action: AdminUserAction;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "warning";
}) {
  const { t } = useI18n();
  const labels: Record<AdminUserAction, string> = {
    activate: t("adminUsers.activate"),
    deactivate: t("adminUsers.deactivate"),
    revoke_sessions: t("adminUsers.revokeSessions"),
    promote_to_administrator: t("adminUsers.promoteToAdmin"),
    demote_to_coordinator: t("adminUsers.demoteToCoordinator"),
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "warning" && "bg-amber-500 text-white hover:bg-amber-600",
        variant === "default" && "bg-primary-600 text-white hover:bg-primary-700"
      )}
    >
      {labels[action]}
    </button>
  );
}

function ActionDialog({
  open,
  title,
  warning,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean;
  title: string;
  warning: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [charCount, setCharCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const MAX_REASON = 500;

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) return;
    onSubmit(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">{title}</h2>
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">{warning}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("adminUsers.reason")} <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={inputRef}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setCharCount(e.target.value.length);
              }}
              maxLength={MAX_REASON}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 h-24 resize-none"
              placeholder={t("adminUsers.reasonRequired")}
              aria-label={t("adminUsers.reason")}
              autoFocus
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {t("adminUsers.characterCount", { count: charCount, max: MAX_REASON })}
            </div>
            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-red-500 mt-1">{t("adminUsers.reasonMinLength", { min: 10 })}</p>
            )}
          </div>

          {error && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {t("actions.cancel")}
            </button>
            <button
              type="submit"
              disabled={reason.trim().length < 10 || isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? t("common.loading") || "Processing..." : title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [dialogAction, setDialogAction] = useState<"activate" | "deactivate" | "revoke_sessions" | "change_role" | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => staffApi.adminUserDetail(userId!),
    enabled: !!userId,
  });

  const updateStatus = useMutation({
    mutationFn: (payload: { is_active: boolean; reason: string; expected_is_active?: boolean }) =>
      staffApi.updateAdminUserStatus(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setDialogAction(null);
      setDialogError(null);
    },
    onError: (err: unknown) => {
      const code = err instanceof ApiRequestError ? err.data.code : undefined;
      if (code === "self_action_forbidden") setDialogError(t("adminUsers.selfActionError"));
      else if (code === "final_administrator_protected") setDialogError(t("adminUsers.finalAdminError"));
      else if (code === "account_state_changed") setDialogError(t("adminUsers.accountChangedConcurrently"));
      else setDialogError(t("adminUsers.errorUpdating"));
    },
  });

  const revokeSessions = useMutation({
    mutationFn: (reason: string) => staffApi.revokeAdminUserSessions(userId!, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      setDialogAction(null);
      setDialogError(null);
    },
    onError: (err: unknown) => {
      const code = err instanceof ApiRequestError ? err.data.code : undefined;
      if (code === "self_action_forbidden") setDialogError(t("adminUsers.selfActionError"));
      else setDialogError(t("adminUsers.errorUpdating"));
    },
  });

  const updateRole = useMutation({
    mutationFn: (payload: { role: "coordinator" | "administrator"; reason: string; expected_role?: string }) =>
      staffApi.updateAdminUserRole(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setDialogAction(null);
      setDialogError(null);
    },
    onError: (err: unknown) => {
      const code = err instanceof ApiRequestError ? err.data.code : undefined;
      if (code === "self_action_forbidden") setDialogError(t("adminUsers.selfActionError"));
      else if (code === "final_administrator_protected") setDialogError(t("adminUsers.finalAdminError"));
      else if (code === "account_role_changed") setDialogError(t("adminUsers.roleChangedConcurrently"));
      else if (code === "invalid_role_transition") setDialogError(t("adminUsers.actionUnavailable"));
      else setDialogError(t("adminUsers.errorUpdating"));
    },
  });

  if (isLoading) {
    return (
      <div aria-busy="true" className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
        <p className="text-red-600 mb-4">{t("adminUsers.errorLoadingDetail")}</p>
        <p className="text-sm text-red-500 mb-4">{error instanceof Error ? error.message : ""}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
        >
          {t("adminUsers.retry")}
        </button>
      </div>
    );
  }

  if (!user) return null;

  const handleDialogSubmit = (reason: string) => {
    setDialogError(null);
    if (dialogAction === "deactivate") {
      updateStatus.mutate({ is_active: false, reason, expected_is_active: true });
    } else if (dialogAction === "activate") {
      updateStatus.mutate({ is_active: true, reason, expected_is_active: false });
    } else if (dialogAction === "revoke_sessions") {
      revokeSessions.mutate(reason);
    } else if (dialogAction === "change_role") {
      const newRole = user.role === "coordinator" ? "administrator" : "coordinator";
      updateRole.mutate({ role: newRole, reason, expected_role: user.role });
    }
  };

  const actions = user.available_actions || [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/app/staff/users")}
        className="flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t("adminUsers.listTitle")}
      </button>

      <h1 className="text-2xl font-bold text-slate-900">{t("adminUsers.detailTitle")}</h1>

      {/* Section A: Account */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("adminUsers.sectionAccount")}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.fullName")}</dt>
            <dd className="text-sm font-medium text-slate-900">{user.full_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.email")}</dt>
            <dd className="text-sm text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.role")}</dt>
            <dd className="text-sm font-medium text-slate-900">{user.role}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.status")}</dt>
            <dd>
              {user.is_active ? (
                <span className="inline-flex items-center text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {t("adminUsers.active")}
                </span>
              ) : (
                <span className="inline-flex items-center text-sm text-slate-500">
                  <XCircle className="h-4 w-4 mr-1" />
                  {t("adminUsers.inactive")}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.dateJoined")}</dt>
            <dd className="text-sm text-slate-900">{new Date(user.date_joined).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.lastLogin")}</dt>
            <dd className="text-sm text-slate-900">
              {user.last_login ? new Date(user.last_login).toLocaleString() : (
                <span className="italic text-slate-400">{t("adminUsers.neverLoggedIn")}</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Section B: Profile */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("adminUsers.sectionProfile")}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user.has_patient_profile && (
            <div>
              <dt className="text-sm text-slate-500">{t("adminUsers.hasPatientProfile")}</dt>
              <dd className="text-sm text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Yes</dd>
            </div>
          )}
          {user.has_doctor_profile && (
            <div>
              <dt className="text-sm text-slate-500">{t("adminUsers.hasDoctorProfile")}</dt>
              <dd className="text-sm text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Yes</dd>
            </div>
          )}
          {user.doctor_approval_status && (
            <div>
              <dt className="text-sm text-slate-500">{t("adminUsers.doctorApprovalStatus")}</dt>
              <dd className="text-sm text-slate-900">{user.doctor_approval_status}</dd>
            </div>
          )}
          {!user.has_patient_profile && !user.has_doctor_profile && (
            <p className="text-sm text-slate-400">{t("adminUsers.actionUnavailable")}</p>
          )}
        </dl>
      </section>

      {/* Section C: Sessions */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("adminUsers.sectionSessions")}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.activeSessions")}</dt>
            <dd className="text-sm font-medium text-slate-900">
              {user.active_refresh_tokens > 0 ? user.active_refresh_tokens : t("adminUsers.noActiveSessions")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t("adminUsers.lastTokenDate")}</dt>
            <dd className="text-sm text-slate-900">
              {user.last_token_created_at ? new Date(user.last_token_created_at).toLocaleString() : t("adminUsers.noActiveSessions")}
            </dd>
          </div>
        </dl>
      </section>

      {/* Section D: Actions */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("adminUsers.sectionActions")}</h2>

        {actions.length === 0 ? (
          <p className="text-sm text-slate-400">{t("adminUsers.actionUnavailable")}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {actions.includes("deactivate") && (
              <ActionButton action="deactivate" onClick={() => setDialogAction("deactivate")} variant="danger" />
            )}
            {actions.includes("activate") && (
              <ActionButton action="activate" onClick={() => setDialogAction("activate")} />
            )}
            {actions.includes("revoke_sessions") && (
              <ActionButton action="revoke_sessions" onClick={() => setDialogAction("revoke_sessions")} variant="warning" />
            )}
            {actions.includes("promote_to_administrator") && (
              <ActionButton action="promote_to_administrator" onClick={() => setDialogAction("change_role")} />
            )}
            {actions.includes("demote_to_coordinator") && (
              <ActionButton action="demote_to_coordinator" onClick={() => setDialogAction("change_role")} variant="warning" />
            )}
          </div>
        )}
      </section>

      {/* Dialogs */}
      <ActionDialog
        open={dialogAction === "deactivate"}
        title={t("adminUsers.deactivateDialogTitle")}
        warning={t("adminUsers.deactivateWarning")}
        onClose={() => { setDialogAction(null); setDialogError(null); }}
        onSubmit={handleDialogSubmit}
        isSubmitting={updateStatus.isPending}
        error={dialogError}
      />

      <ActionDialog
        open={dialogAction === "activate"}
        title={t("adminUsers.activateDialogTitle")}
        warning={t("adminUsers.activateWarning")}
        onClose={() => { setDialogAction(null); setDialogError(null); }}
        onSubmit={handleDialogSubmit}
        isSubmitting={updateStatus.isPending}
        error={dialogError}
      />

      <ActionDialog
        open={dialogAction === "revoke_sessions"}
        title={t("adminUsers.revokeDialogTitle")}
        warning={t("adminUsers.revokeWarning")}
        onClose={() => { setDialogAction(null); setDialogError(null); }}
        onSubmit={handleDialogSubmit}
        isSubmitting={revokeSessions.isPending}
        error={dialogError}
      />

      <ActionDialog
        open={dialogAction === "change_role"}
        title={t("adminUsers.roleDialogTitle")}
        warning={t("adminUsers.roleWarning")}
        onClose={() => { setDialogAction(null); setDialogError(null); }}
        onSubmit={handleDialogSubmit}
        isSubmitting={updateRole.isPending}
        error={dialogError}
      />
    </div>
  );
}
