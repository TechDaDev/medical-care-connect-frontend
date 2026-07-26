import { useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Download, Activity, AlertTriangle, Info, XCircle, CheckCircle } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import { useI18n } from "../../i18n";
import { auditApi } from "../../api/audit";
import type { AuditEventSeverity, AuditEventResult, AuditEventCategory } from "../../types/staff";
import { clsx } from "../../utils/clsx";
import { ApiRequestError } from "../../utils/errors";

const severityIcons: Record<AuditEventSeverity, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  critical: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

const severityColors: Record<AuditEventSeverity, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

const resultIcons: Record<AuditEventResult, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  denied: <XCircle className="h-4 w-4 text-red-500" />,
  failed: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

export function AuditEventListPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const categoryFilter = searchParams.get("category") || "";
  const severityFilter = searchParams.get("severity") || "";
  const resultFilter = searchParams.get("result") || "";
  const searchValue = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchValue);
  const debouncedSearch = useDebounce(searchInput, 400);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k); });
      if (updates.page === undefined && !updates.search && !updates.category && !updates.severity && !updates.result) p.set("page", "1");
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["audit-events", page, categoryFilter || undefined, severityFilter || undefined, resultFilter || undefined, debouncedSearch || undefined],
    queryFn: () =>
      auditApi.events({
        page,
        page_size: 50,
        category: categoryFilter as AuditEventCategory | undefined,
        severity: severityFilter as AuditEventSeverity | undefined,
        result: resultFilter as AuditEventResult | undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const handleCsvExport = async () => {
    setCsvLoading(true);
    setCsvError(null);
    try {
      const resp = await auditApi.exportCsv({
        category: categoryFilter as AuditEventCategory | undefined,
        severity: severityFilter as AuditEventSeverity | undefined,
        result: resultFilter as AuditEventResult | undefined,
        created_after: searchParams.get("created_after") || undefined,
        created_before: searchParams.get("created_before") || undefined,
      });
      const blob = resp.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError && err.status === 400) {
        setCsvError(t("audit.dateRangeRequired"));
      } else {
        setCsvError(t("audit.csvExportError"));
      }
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900">{t("audit.title")}</h1>
        </div>
        <button
          onClick={handleCsvExport}
          disabled={csvLoading}
          className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
          aria-label={t("audit.exportCsv")}
        >
          <Download className="h-4 w-4" />
          {csvLoading ? t("common.loading") : t("audit.exportCsv")}
        </button>
      </div>
      {csvError && <div className="text-sm text-red-600" role="alert">{csvError}</div>}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={categoryFilter} onChange={(e) => updateParams({ category: e.target.value, page: "1" })} className="border rounded-lg px-3 py-1.5 text-sm" aria-label={t("audit.category")}>
          <option value="">{t("common.all")}</option>
          {(["account", "privacy", "doctor", "consultation", "security", "system"] as AuditEventCategory[]).map((c) => (
            <option key={c} value={c}>{t(`audit.category${c.charAt(0).toUpperCase() + c.slice(1)}`)}</option>
          ))}
        </select>
        <select value={severityFilter} onChange={(e) => updateParams({ severity: e.target.value, page: "1" })} className="border rounded-lg px-3 py-1.5 text-sm" aria-label={t("audit.severity")}>
          <option value="">{t("common.all")}</option>
          {(["info", "warning", "critical"] as AuditEventSeverity[]).map((s) => (
            <option key={s} value={s}>{t(`audit.severity${s.charAt(0).toUpperCase() + s.slice(1)}`)}</option>
          ))}
        </select>
        <select value={resultFilter} onChange={(e) => updateParams({ result: e.target.value, page: "1" })} className="border rounded-lg px-3 py-1.5 text-sm" aria-label={t("audit.result")}>
          <option value="">{t("common.all")}</option>
          {(["success", "denied", "failed"] as AuditEventResult[]).map((r) => (
            <option key={r} value={r}>{t(`audit.result${r.charAt(0).toUpperCase() + r.slice(1)}`)}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); updateParams({ search: e.target.value, page: "1" }); }}
          placeholder={t("audit.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
          aria-label={t("common.search")}
        />
      </div>

      {/* Content */}
      {isLoading && <div className="text-center py-8 text-slate-500" role="status" aria-busy="true">{t("audit.loading")}</div>}
      {isError && (
        <div className="text-center py-8" role="alert">
          <p className="text-red-600 mb-2">{t("audit.errorLoading")}</p>
          <button onClick={() => refetch()} className="text-primary-600 hover:underline text-sm">{t("audit.retry")}</button>
        </div>
      )}
      {data && data.results.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Activity className="h-12 w-12 mx-auto mb-2 text-slate-300" />
          <p>{t("audit.noEvents")}</p>
          <p className="text-sm">{t("audit.noEventsDescription")}</p>
        </div>
      )}
      {data && data.results.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">{t("audit.occurredAt")}</th>
                  <th className="pb-3 font-medium">{t("audit.eventType")}</th>
                  <th className="pb-3 font-medium">{t("audit.severity")}</th>
                  <th className="pb-3 font-medium">{t("audit.result")}</th>
                  <th className="pb-3 font-medium">{t("audit.actor")}</th>
                  <th className="pb-3 font-medium">{t("audit.target")}</th>
                  <th className="pb-3 font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((ev) => (
                  <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 text-slate-600 text-xs">{new Date(ev.occurred_at).toLocaleString()}</td>
                    <td className="py-3 font-medium text-slate-900">{ev.event_type}</td>
                    <td className="py-3">
                      <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", severityColors[ev.severity])}>
                        {severityIcons[ev.severity]}
                        {t(`audit.severity${ev.severity.charAt(0).toUpperCase() + ev.severity.slice(1)}`)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1">{resultIcons[ev.result]} {t(`audit.result${ev.result.charAt(0).toUpperCase() + ev.result.slice(1)}`)}</span>
                    </td>
                    <td className="py-3 text-slate-600">{ev.actor?.full_name || ev.actor?.id || "-"}</td>
                    <td className="py-3 text-slate-600 text-xs">{ev.target_type}:{ev.target_id?.slice(0, 8) || "-"}</td>
                    <td className="py-3">
                      <Link to={`/app/staff/audit/${ev.id}`} className="text-primary-600 hover:underline text-sm">{t("common.view")}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.count > 50 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-500">{t("common.page")} {page} / {Math.ceil(data.count / 50)}</p>
              <div className="flex gap-2">
                <button onClick={() => updateParams({ page: String(page - 1) })} disabled={!data.previous} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => updateParams({ page: String(page + 1) })} disabled={!data.next} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
