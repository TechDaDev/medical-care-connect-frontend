import { useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Shield, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import { useI18n } from "../../i18n";
import { privacyAdminApi } from "../../api/privacyAdmin";
import type { PrivacyDeletionStatus } from "../../types/staff";
import { clsx } from "../../utils/clsx";

const statusBadgeColors: Record<PrivacyDeletionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  processing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: PrivacyDeletionStatus }) {
  const { t } = useI18n();
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", statusBadgeColors[status])}>
      {t(`privacyRequests.${status}`)}
    </span>
  );
}

export function PrivacyRequestListPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const statusFilter = (searchParams.get("status") || "") as PrivacyDeletionStatus | "";
  const searchValue = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchValue);
  const debouncedSearch = useDebounce(searchInput, 400);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k); });
      if (updates.page === undefined && !updates.search && !updates.status) p.set("page", "1");
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["privacy-deletion-requests", page, statusFilter || undefined, debouncedSearch || undefined],
    queryFn: () =>
      privacyAdminApi.deletionRequests({
        page,
        page_size: 20,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const statusTabs: Array<{ key: PrivacyDeletionStatus | ""; icon: React.ReactNode }> = [
    { key: "", icon: <Clock className="h-4 w-4" /> },
    { key: "pending", icon: <Clock className="h-4 w-4" /> },
    { key: "approved", icon: <CheckCircle className="h-4 w-4" /> },
    { key: "rejected", icon: <XCircle className="h-4 w-4" /> },
    { key: "completed", icon: <CheckCircle className="h-4 w-4" /> },
    { key: "failed", icon: <AlertCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900">{t("privacyRequests.title")}</h1>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map(({ key, icon }) => (
          <button
            key={key || "all"}
            onClick={() => updateParams({ status: key, page: "1" })}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              statusFilter === key ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            {icon}
            {key ? t(`privacyRequests.${key}`) : t("common.all")}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); updateParams({ search: e.target.value, page: "1" }); }}
          placeholder={t("privacyRequests.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          aria-label={t("common.search")}
        />
      </div>

      {/* Content */}
      {isLoading && <div className="text-center py-8 text-slate-500" role="status" aria-busy="true">{t("privacyRequests.loading")}</div>}
      {isError && (
        <div className="text-center py-8" role="alert">
          <p className="text-red-600 mb-2">{t("privacyRequests.errorLoading")}</p>
          <button onClick={() => refetch()} className="text-primary-600 hover:underline text-sm">{t("privacyRequests.retry")}</button>
        </div>
      )}
      {data && data.results.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Shield className="h-12 w-12 mx-auto mb-2 text-slate-300" />
          <p>{t("privacyRequests.noRequests")}</p>
          <p className="text-sm">{t("privacyRequests.noRequestsDescription")}</p>
        </div>
      )}
      {data && data.results.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">{t("privacyRequests.requester")}</th>
                  <th className="pb-3 font-medium">{t("privacyRequests.status")}</th>
                  <th className="pb-3 font-medium">{t("privacyRequests.createdDate")}</th>
                  <th className="pb-3 font-medium">{t("privacyRequests.decidedDate")}</th>
                  <th className="pb-3 font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{req.requester.full_name}</div>
                      <div className="text-slate-500 text-xs">{req.requester.email}</div>
                    </td>
                    <td className="py-3"><StatusBadge status={req.status} /></td>
                    <td className="py-3 text-slate-600">{new Date(req.requested_at).toLocaleDateString()}</td>
                    <td className="py-3 text-slate-600">{req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : "-"}</td>
                    <td className="py-3">
                      <Link to={`/app/staff/privacy-requests/${req.id}`} className="text-primary-600 hover:underline text-sm">
                        {t("common.view")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.count > 20 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-500">{t("common.page")} {page} / {Math.ceil(data.count / 20)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateParams({ page: String(page - 1) })}
                  disabled={!data.previous}
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
                  aria-label={t("common.previousPage")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => updateParams({ page: String(page + 1) })}
                  disabled={!data.next}
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
                  aria-label={t("common.nextPage")}
                >
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
