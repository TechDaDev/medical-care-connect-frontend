import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";

interface DeletionRequest {
  id: string;
  status: string;
  reason: string;
  requested_at: string;
  rejection_reason: string;
}

export function PrivacyDeletionPage() {
  const { t, formatDateTime } = useI18n();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/privacy/deletion-requests/", { credentials: "include" });
        if (!resp.ok) throw new Error();
        if (!cancelled) setRequests(await resp.json());
      } catch {
        if (!cancelled) setError(t("error.network"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  const reloadRequests = async () => {
    try {
      const resp = await fetch("/api/privacy/deletion-requests/", { credentials: "include" });
      if (resp.ok) setRequests(await resp.json());
    } catch { /* ignore */ }
  };

  const submitRequest = async () => {
    setSubmitting(true);
    try {
      const resp = await fetch("/api/privacy/deletion-requests/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, confirmation }),
      });
      if (resp.status === 409) {
        setError(t("privacy.activeDeletionExists"));
        await reloadRequests();
        return;
      }
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(
          typeof data.detail === "string"
            ? data.detail
            : t("privacy.validationError"),
        );
        return;
      }
      setReason("");
      setConfirmation(false);
      await reloadRequests();
    } catch {
      setError(t("error.network"));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      await fetch(`/api/privacy/deletion-requests/${id}/cancel/`, {
        method: "POST",
        credentials: "include",
      });
      await reloadRequests();
    } catch {
      setError(t("error.network"));
    }
  };

  const deactivateAccount = async () => {
    setDeactivating(true);
    try {
      const resp = await fetch("/api/privacy/account/deactivate/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deactivatePassword }),
      });
      if (!resp.ok) throw new Error();
      setShowDeactivateConfirm(false);
      setDeactivatePassword("");
      alert(t("privacy.deactivatedSuccess"));
    } catch {
      setError(t("error.network"));
    } finally {
      setDeactivating(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-gray-100 text-gray-500",
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-100"}`;
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("privacy.accountManagement")}</h1>

      {error && <p className="text-red-600 text-sm mb-4" role="alert">{error}</p>}

      {/* Retention warning */}
      <Card>
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">{t("privacy.retentionWarning")}</p>
        </div>
      </Card>

      {/* Deactivate */}
      <Card className="mt-4">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("privacy.deactivateAccount")}</h2>
          <p className="text-sm text-gray-600 mb-4">{t("privacy.deactivateDescription")}</p>
          {!showDeactivateConfirm ? (
            <Button variant="secondary" onClick={() => setShowDeactivateConfirm(true)}>
              {t("privacy.deactivateAccount")}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600 font-medium">{t("privacy.deactivateConfirm")}</p>
              <input
                type="password"
                placeholder={t("auth.password")}
                value={deactivatePassword}
                onChange={(e) => setDeactivatePassword(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={deactivateAccount} loading={deactivating} disabled={!deactivatePassword}>
                  {t("common.confirm")}
                </Button>
                <Button variant="secondary" onClick={() => setShowDeactivateConfirm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Deletion request */}
      <Card className="mt-4">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("privacy.requestDeletion")}</h2>
          <p className="text-sm text-gray-600 mb-4">{t("privacy.deletionDescription")}</p>

          <textarea
            placeholder={t("privacy.deletionReason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm mb-3"
            rows={3}
            minLength={10}
            maxLength={1000}
          />
          <label className="mb-3 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={confirmation}
              onChange={(event) => setConfirmation(event.target.checked)}
            />
            {t("privacy.deletionConfirmation")}
          </label>
          <Button
            onClick={submitRequest}
            loading={submitting}
            disabled={reason.trim().length < 10 || !confirmation || requests.some((item) => ["pending", "approved", "processing"].includes(item.status))}
          >
            {t("privacy.requestDeletion")}
          </Button>
        </div>
      </Card>

      {/* Existing requests */}
      {requests.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-gray-900">{t("privacy.existingRequests")}</h3>
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className={statusBadge(r.status)}>{t(`privacy.deletionStatus.${r.status}`)}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.requested_at ? formatDateTime(r.requested_at) : ""}
                  </p>
                  {r.rejection_reason && (
                    <p className="text-xs text-red-500 mt-1">{r.rejection_reason}</p>
                  )}
                </div>
                {r.status === "pending" && (
                  <Button size="sm" variant="secondary" onClick={() => cancelRequest(r.id)}>
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link to="/app/patient/privacy" className="text-sm text-blue-600 hover:underline">
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}
