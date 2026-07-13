import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";

interface ExportRequest {
  id: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  expires_at: string | null;
  size_bytes: number | null;
  failure_code: string;
}

export function PrivacyExportsPage() {
  const [requesting, setRequesting] = useState(false);
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/privacy/exports/", { credentials: "include" });
        if (!resp.ok) throw new Error("Failed to load");
        if (!cancelled) setExports(await resp.json());
      } catch {
        if (!cancelled) setError(t("error.network"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const reloadExports = async () => {
    try {
      const resp = await fetch("/api/privacy/exports/", { credentials: "include" });
      if (resp.ok) setExports(await resp.json());
    } catch { /* ignore */ }
  };

  const requestExport = async () => {
    setRequesting(true);
    try {
      const resp = await fetch("/api/privacy/exports/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!resp.ok) throw new Error("Failed");
      await reloadExports();
    } catch {
      setError(t("error.network"));
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const resp = await fetch(`/api/privacy/exports/${id}/download/`, {
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("error.network"));
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-100"}`;
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("privacy.exportData")}</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="mb-6">
        <Button onClick={requestExport} loading={requesting} disabled={requesting}>
          {t("privacy.requestExport")}
        </Button>
      </div>

      {exports.length === 0 ? (
        <p className="text-gray-500">{t("privacy.noExports")}</p>
      ) : (
        <div className="space-y-3">
          {exports.map((exp) => (
            <Card key={exp.id}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className={statusBadge(exp.status)}>
                    {t(`privacy.exportStatus.${exp.status}`)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {exp.requested_at ? new Date(exp.requested_at).toLocaleString() : ""}
                  </p>
                  {exp.failure_code && (
                    <p className="text-xs text-red-500 mt-1">{exp.failure_code}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {exp.status === "completed" && (
                    <Button size="sm" onClick={() => handleDownload(exp.id)}>
                      {t("common.download")}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link to="/app/privacy" className="text-sm text-blue-600 hover:underline">
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}
