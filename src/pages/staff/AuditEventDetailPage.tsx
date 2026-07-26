import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { useI18n } from "../../i18n";
import { auditApi } from "../../api/audit";
import type { AuditEventSeverity, AuditEventResult } from "../../types/staff";
import { clsx } from "../../utils/clsx";

const severityColors: Record<AuditEventSeverity, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

export function AuditEventDetailPage() {
  const { t } = useI18n();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-event", eventId],
    queryFn: () => auditApi.eventDetail(eventId!),
    enabled: !!eventId,
  });

  if (isLoading) return <div className="text-center py-8 text-slate-500" role="status" aria-busy="true">{t("audit.loading")}</div>;
  if (isError || !data) return <div className="text-center py-8" role="alert"><p className="text-red-600">{t("audit.errorLoadingDetail")}</p></div>;

  const d = data;
  const meta = d.metadata_safe;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate("/app/staff/audit")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">{t("audit.eventDetail")}</h1>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-500">{t("audit.eventType")}</dt><dd className="font-medium font-mono text-xs">{d.event_type}</dd></div>
          <div><dt className="text-slate-500">{t("audit.occurredAt")}</dt><dd className="font-medium">{new Date(d.occurred_at).toLocaleString()}</dd></div>
          <div>
            <dt className="text-slate-500 mb-1">{t("audit.severity")}</dt>
            <dd><span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", severityColors[d.severity])}>{t(`audit.severity${d.severity.charAt(0).toUpperCase() + d.severity.slice(1)}`)}</span></dd>
          </div>
          <div>
            <dt className="text-slate-500 mb-1">{t("audit.result")}</dt>
            <dd className="font-medium">{t(`audit.result${d.result.charAt(0).toUpperCase() + d.result.slice(1)}`)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("audit.category")}</dt>
            <dd className="font-medium">{t(`audit.category${d.category.charAt(0).toUpperCase() + d.category.slice(1)}`)}</dd>
          </div>
          <div><dt className="text-slate-500">{t("audit.source")}</dt><dd className="font-medium">{d.source || "-"}</dd></div>
          {d.actor && (
            <div className="col-span-2">
              <dt className="text-slate-500">{t("audit.actor")}</dt>
              <dd className="font-medium">{d.actor.full_name} ({d.actor.role})</dd>
            </div>
          )}
          <div><dt className="text-slate-500">{t("audit.target")}</dt><dd className="font-medium">{d.target_type}:{d.target_id?.slice(0, 12) || "-"}</dd></div>
          {d.request_id && <div><dt className="text-slate-500">{t("audit.requestId")}</dt><dd className="font-medium font-mono text-xs">{d.request_id}</dd></div>}
          <div className="col-span-2"><dt className="text-slate-500">{t("audit.retentionClass")}</dt><dd className="font-medium">{d.retention_class}</dd></div>
        </dl>

        {d.summary && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-1">{t("common.description")}</h3>
            <p className="text-sm text-slate-900">{d.summary}</p>
          </div>
        )}

        {meta && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-2">{t("audit.sanitizedMetadata")}</h3>
            <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap">{JSON.stringify(meta, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
