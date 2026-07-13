import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";


interface StatusData {
  version: string;
  release: string;
  environment: string;
  database_available: boolean;
  attachment_backend_provider: string;
  attachment_root_writable: boolean;
  attachment_scan_mode: string;
  ai_enabled: boolean;
  error_monitor_provider: string;
  retention_candidates: number;
  degraded_components: string[];
}

interface MetricsData {
  uptime_seconds: number;
  users: Record<string, number>;
  consultations: Record<string, number>;
  attachments: { by_status: Record<string, number>; total_bytes: number };
  notifications_pending: number;
  retention_candidates: number;
}

export function OperationsStatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sResp, mResp] = await Promise.all([
          fetch("/api/staff/operations/status/", { credentials: "include" }),
          fetch("/api/staff/operations/metrics/", { credentials: "include" }),
        ]);
        if (sResp.ok) setStatus(await sResp.json());
        if (mResp.ok) setMetrics(await mResp.json());
      } catch {
        setError(t("error.network"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("operations.title")}</h1>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatusCard label={t("operations.database")} ok={status?.database_available} />
        <StatusCard label={t("operations.attachmentStorage")} ok={status?.attachment_root_writable} />
        <StatusCard label={t("operations.environment")} value={status?.environment} />
        <StatusCard label={t("operations.version")} value={status?.version} />
        <StatusCard label={t("operations.attachmentBackend")} value={status?.attachment_backend_provider} />
        <StatusCard label={t("operations.scanMode")} value={status?.attachment_scan_mode} />
        <StatusCard label={t("operations.aiEnabled")} ok={!status?.ai_enabled} />
        <StatusCard label={t("operations.errorMonitor")} value={status?.error_monitor_provider} />
        <StatusCard label={t("operations.retentionCandidates")} value={String(status?.retention_candidates ?? "N/A")} />
      </div>

      {status?.degraded_components && status.degraded_components.length > 0 && (
        <Card>
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded mb-6">
            <p className="text-sm text-red-800 font-medium">
              {t("operations.degraded")}: {status.degraded_components.join(", ")}
            </p>
          </div>
        </Card>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">{t("operations.metrics")}</h2>

          <Card>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{t("operations.users")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(metrics.users).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{t("operations.consultations")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(metrics.consultations).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{t("operations.attachments")}</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(metrics.attachments.by_status).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-gray-500">{t("operations.totalBytes")}</span>
                  <span className="font-medium">{formatBytes(metrics.attachments.total_bytes)}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold">{formatUptime(metrics.uptime_seconds)}</p>
                <p className="text-xs text-gray-500">{t("operations.uptime")}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold">{metrics.notifications_pending}</p>
                <p className="text-xs text-gray-500">{t("operations.pendingNotifications")}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold">{metrics.retention_candidates}</p>
                <p className="text-xs text-gray-500">{t("operations.retentionCandidates")}</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link to="/app/staff" className="text-sm text-blue-600 hover:underline">
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}

function StatusCard({ label, ok, value }: { label: string; ok?: boolean; value?: string }) {
  return (
    <Card>
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        {value !== undefined ? (
          <p className="text-sm font-medium">{value}</p>
        ) : (
          <span className={`inline-block w-3 h-3 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
        )}
      </div>
    </Card>
  );
}

function formatBytes(n: number): string {
  for (const unit of ["B", "KB", "MB", "GB"]) {
    if (n < 1024) return `${n.toFixed(1)} ${unit}`;
    n /= 1024;
  }
  return `${n.toFixed(1)} TB`;
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return `${d}d ${h}h`;
}
