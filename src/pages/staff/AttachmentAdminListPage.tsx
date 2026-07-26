import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { attachmentsAdminApi } from "../../api/attachmentsAdmin";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { PageHeader } from "../../components/common/PageHeader";
import { useI18n } from "../../i18n";
import type {
  AdminAttachmentScanStatus,
  AdminAttachmentStatus,
} from "../../types/adminPhaseE";
import { getErrorMessage } from "../../utils/errors";

const statuses: AdminAttachmentStatus[] = [
  "pending", "available", "quarantined", "rejected", "deleted",
];
const scanStatuses: AdminAttachmentScanStatus[] = [
  "pending", "clean", "suspicious", "infected", "failed", "not_required",
];

export function AttachmentAdminListPage() {
  const { t, formatDateTime, formatFileSize } = useI18n();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const statusValue = (params.get("status") || "") as AdminAttachmentStatus | "";
  const scanValue = (params.get("scanner_result") || "") as AdminAttachmentScanStatus | "";
  const mime = params.get("mime_type") || "";
  const ownerType = params.get("owner_type") || "";
  const createdAfter = params.get("created_after") || "";
  const createdBefore = params.get("created_before") || "";
  const sizeMin = params.get("size_min") || "";
  const sizeMax = params.get("size_max") || "";
  const search = params.get("search") || "";
  const ordering = params.get("ordering") || "-created_at";

  const query = useQuery({
    queryKey: [
      "admin-attachments", page, statusValue, scanValue, mime, ownerType,
      createdAfter, createdBefore, sizeMin, sizeMax, search, ordering,
    ],
    queryFn: () =>
      attachmentsAdminApi.list({
        page,
        page_size: 20,
        status: statusValue || undefined,
        scanner_result: scanValue || undefined,
        mime_type: mime || undefined,
        owner_type: ownerType === "consultation" ? "consultation" : undefined,
        created_after: createdAfter || undefined,
        created_before: createdBefore || undefined,
        size_min: sizeMin ? Number(sizeMin) : undefined,
        size_max: sizeMax ? Number(sizeMax) : undefined,
        search: search || undefined,
        ordering,
      }),
  });

  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next, { replace: true });
  };

  if (query.isError) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  }

  const data = query.data;
  return (
    <div className="space-y-5" aria-busy={query.isLoading || query.isFetching}>
      <PageHeader
        title={t("attachmentAdmin.title")}
        actions={<Button variant="outline" onClick={() => query.refetch()}>{t("common.refresh")}</Button>}
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("attachmentAdmin.status")}>
        <Button variant={!statusValue ? "primary" : "outline"} size="sm" onClick={() => updateParams({ status: "", page: "1" })}>
          {t("common.all")}
        </Button>
        {statuses.map((item) => (
          <Button
            key={item}
            variant={statusValue === item ? "primary" : "outline"}
            size="sm"
            onClick={() => updateParams({ status: item, page: "1" })}
          >
            {t(`attachmentAdmin.status.${item}`)}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <Input label={t("common.search")} value={search} onChange={(e) => updateParams({ search: e.target.value, page: "1" })} />
        <Input label={t("attachmentAdmin.mimeType")} value={mime} onChange={(e) => updateParams({ mime_type: e.target.value, page: "1" })} />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t("attachmentAdmin.ownerType")}</span>
          <select className="block w-full rounded-lg border border-slate-300 px-3 py-2" value={ownerType} onChange={(e) => updateParams({ owner_type: e.target.value, page: "1" })}>
            <option value="">{t("common.all")}</option>
            <option value="consultation">{t("attachmentAdmin.owner.consultation")}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t("attachmentAdmin.scanResult")}</span>
          <select className="block w-full rounded-lg border border-slate-300 px-3 py-2" value={scanValue} onChange={(e) => updateParams({ scanner_result: e.target.value, page: "1" })}>
            <option value="">{t("common.all")}</option>
            {scanStatuses.map((item) => <option key={item} value={item}>{t(`attachmentAdmin.scan.${item}`)}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t("specialtyAdmin.ordering")}</span>
          <select className="block w-full rounded-lg border border-slate-300 px-3 py-2" value={ordering} onChange={(e) => updateParams({ ordering: e.target.value, page: "1" })}>
            <option value="-created_at">{t("specialtyAdmin.createdAt")} ↓</option>
            <option value="created_at">{t("specialtyAdmin.createdAt")} ↑</option>
            <option value="-size_bytes">{t("attachmentAdmin.fileSize")} ↓</option>
            <option value="status">{t("attachmentAdmin.status")}</option>
          </select>
        </label>
        <Input type="date" label={t("attachmentAdmin.createdAfter")} value={createdAfter} onChange={(e) => updateParams({ created_after: e.target.value, page: "1" })} />
        <Input type="date" label={t("attachmentAdmin.createdBefore")} value={createdBefore} onChange={(e) => updateParams({ created_before: e.target.value, page: "1" })} />
        <Input type="number" min="0" label={t("attachmentAdmin.sizeMin")} value={sizeMin} onChange={(e) => updateParams({ size_min: e.target.value, page: "1" })} />
        <Input type="number" min="0" label={t("attachmentAdmin.sizeMax")} value={sizeMax} onChange={(e) => updateParams({ size_max: e.target.value, page: "1" })} />
      </div>

      {query.isLoading ? (
        <div className="rounded-lg border bg-white p-8 text-center">{t("common.loading")}</div>
      ) : !data?.results.length ? (
        <EmptyState message={t("attachmentAdmin.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["file", "status", "scanResult", "owner", "createdAt", "retention", "actions"].map((key) => (
                  <th key={key} scope="col" className="px-4 py-3 text-start text-xs font-semibold text-slate-600">{t(`attachmentAdmin.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.results.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{item.filename}</div>
                    <div className="text-xs text-slate-500">{item.mime_type} · {formatFileSize(item.size_bytes)}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={item.status === "available" ? "success" : item.status === "quarantined" || item.status === "rejected" ? "danger" : "neutral"}>{t(`attachmentAdmin.status.${item.status}`)}</Badge></td>
                  <td className="px-4 py-3 text-sm">{t(`attachmentAdmin.scan.${item.scanner_status}`)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.owner_reference.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm">{formatDateTime(item.created_at)}</td>
                  <td className="px-4 py-3 text-sm">{item.retention_eligible ? t("common.yes") : t("common.no")}</td>
                  <td className="px-4 py-3">
                    <Link to={`/app/staff/attachments/${item.id}`}>
                      <Button size="sm" variant="outline">{t("common.view")}</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.count > 20 && (
        <div className="flex justify-between">
          <Button variant="outline" disabled={!data.previous} onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}>{t("common.previous")}</Button>
          <span className="text-sm text-slate-600">{page}</span>
          <Button variant="outline" disabled={!data.next} onClick={() => updateParams({ page: String(page + 1) })}>{t("common.next")}</Button>
        </div>
      )}
    </div>
  );
}
