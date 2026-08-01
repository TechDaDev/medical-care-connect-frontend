import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi, type DoctorConsultationFilters } from "../../api/consultations";
import type { DoctorConsultationQueueItem } from "../../types";
import { useI18n } from "../../i18n";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { ConsultationStatusBadge } from "../../components/consultations/ConsultationStatusBadge";

const STATUS_GROUPS = ["", "new_requests", "needs_action", "active", "awaiting_patient", "completed", "cancelled"];
const ORDERINGS = ["-updated_at", "updated_at", "-created_at", "created_at"];

export function DoctorConsultationList() {
  const { t, formatDateTime } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters: DoctorConsultationFilters = {
    status_group: searchParams.get("status_group") || undefined,
    priority: searchParams.get("priority") || undefined,
    search: searchParams.get("search") || undefined,
    ordering: searchParams.get("ordering") || "-updated_at",
    needs_doctor_action: searchParams.get("needs_doctor_action") === "true" || undefined,
    has_unread_messages: searchParams.get("has_unread_messages") === "true" || undefined,
    has_completed_intake: searchParams.get("has_completed_intake") === "true" || undefined,
    page: Number(searchParams.get("page") || 1),
    page_size: 20,
  };
  const query = useQuery({
    queryKey: ["doctor-consultations", filters],
    queryFn: () => consultationsApi.listDoctor(filters),
  });

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next, { replace: true });
  };

  return (
    <main>
      <PageHeader title={t("doctorPhaseB.queueTitle")} />
      <nav aria-label={t("doctorPhaseB.statusGroup")} className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {STATUS_GROUPS.map((group) => <button key={group || "all"} type="button" aria-current={(filters.status_group || "") === group ? "page" : undefined} onClick={() => update("status_group", group)} className={`min-h-10 whitespace-nowrap rounded-full px-4 text-sm font-medium ${(filters.status_group || "") === group ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{group ? t(`doctorPhaseB.group.${group}`) : t("common.all")}</button>)}
      </nav>
      <section aria-label={t("doctorPhaseB.filters")} className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <Input
          id="consultation-search"
          label={t("common.search")}
          value={filters.search || ""}
          onChange={(event) => update("search", event.target.value)}
        />
        <Select
          id="status-group"
          label={t("doctorPhaseB.statusGroup")}
          value={filters.status_group || ""}
          onChange={(event) => update("status_group", event.target.value)}
          options={STATUS_GROUPS.map((value) => ({ value, label: value ? t(`doctorPhaseB.group.${value}`) : t("common.all") }))}
        />
        <Select
          id="queue-ordering"
          label={t("doctorPhaseB.ordering")}
          value={filters.ordering}
          onChange={(event) => update("ordering", event.target.value)}
          options={ORDERINGS.map((value) => ({ value, label: t(`doctorPhaseB.order.${value}`) }))}
        />
        <Select
          id="queue-priority"
          label={t("doctorPhaseB.priority")}
          value={filters.priority || ""}
          onChange={(event) => update("priority", event.target.value)}
          options={["", "low", "medium", "high", "urgent"].map((value) => ({ value, label: value ? t(`doctorPhaseB.priority.${value}`) : t("common.all") }))}
        />
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={!!filters.needs_doctor_action} onChange={(event) => update("needs_doctor_action", event.target.checked ? "true" : "")} />{t("doctorPhaseB.needsAction")}</label>
          <label className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={!!filters.has_unread_messages} onChange={(event) => update("has_unread_messages", event.target.checked ? "true" : "")} />{t("doctorPhaseB.unreadOnly")}</label>
          <label className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={!!filters.has_completed_intake} onChange={(event) => update("has_completed_intake", event.target.checked ? "true" : "")} />{t("doctorPhaseB.intakeOnly")}</label>
        </div>
      </section>

      {query.isLoading && <Spinner />}
      {query.error && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.results.length === 0 && <EmptyState message={t("consultation.noResults")} />}
      {query.data && query.data.results.length > 0 && (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="px-4 py-3 text-start">{t("doctorPhaseB.patient")}</th>
                <th className="px-4 py-3 text-start">{t("doctorPhaseB.status")}</th>
                <th className="px-4 py-3 text-start">{t("doctorPhaseB.updated")}</th>
                <th className="px-4 py-3 text-start">{t("doctorPhaseB.signals")}</th>
                <th className="px-4 py-3 text-start"><span className="sr-only">{t("common.actions")}</span></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-200">{query.data.results.map((item) => <QueueRow key={item.id} item={item} formatDateTime={formatDateTime} t={t} />)}</tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">{query.data.results.map((item) => <QueueCard key={item.id} item={item} formatDateTime={formatDateTime} t={t} />)}</div>
          <nav aria-label={t("common.pagination")} className="mt-5 flex items-center justify-between">
            <Button variant="outline" disabled={!query.data.previous} onClick={() => update("page", String(Math.max(1, (filters.page || 1) - 1)))}>{t("common.previous")}</Button>
            <span className="text-sm text-slate-600">{t("common.page")} {filters.page}</span>
            <Button variant="outline" disabled={!query.data.next} onClick={() => update("page", String((filters.page || 1) + 1))}>{t("common.next")}</Button>
          </nav>
        </>
      )}
    </main>
  );
}

type RowProps = { item: DoctorConsultationQueueItem; formatDateTime: (value: string) => string; t: (key: string) => string };

function Signals({ item, t }: Pick<RowProps, "item" | "t">) {
  return <div className="flex flex-wrap gap-1.5">
    {item.needs_doctor_action && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">{t("doctorPhaseB.actionNeeded")}</span>}
    {item.unread_messages > 0 && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900">{item.unread_messages} {t("doctorPhaseB.unread")}</span>}
    {item.has_completed_intake && <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-medium text-teal-900">{t("doctorPhaseB.intakeReady")}</span>}
    {item.attachment_count > 0 && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{item.attachment_count} {t("attachment.title")}</span>}
  </div>;
}

function QueueRow({ item, formatDateTime, t }: RowProps) {
  return <tr>
    <td className="px-4 py-3"><p className="font-medium text-slate-900">{item.patient.display_name}</p><p className="text-xs text-slate-500">{item.specialty?.name}</p></td>
    <td className="px-4 py-3"><ConsultationStatusBadge status={item.status} /></td>
    <td className="px-4 py-3 text-slate-600"><time dateTime={item.updated_at}>{formatDateTime(item.updated_at)}</time></td>
    <td className="px-4 py-3"><Signals item={item} t={t} /></td>
    <td className="px-4 py-3 text-end"><Link className="font-medium text-primary-700 hover:underline" to={`/app/doctor/consultations/${item.id}`}>{t("doctorPhaseB.openWorkspace")}</Link></td>
  </tr>;
}

function QueueCard({ item, formatDateTime, t }: RowProps) {
  return <Card><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.patient.display_name}</p><p className="text-sm text-slate-500">{item.specialty?.name}</p></div><ConsultationStatusBadge status={item.status} /></div><div className="my-3"><Signals item={item} t={t} /></div><div className="flex items-center justify-between"><time className="text-xs text-slate-500" dateTime={item.updated_at}>{formatDateTime(item.updated_at)}</time><Link className="font-medium text-primary-700" to={`/app/doctor/consultations/${item.id}`}>{t("doctorPhaseB.openWorkspace")}</Link></div></Card>;
}
