import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doctorPhaseDApi } from "../../api/doctorPhaseD";
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Spinner } from "../../components/common";
import { useI18n } from "../../i18n";

const TABS = ["needs_reply", "unread", "active", "closed", "all"] as const;

export function DoctorMessagesPage() {
  const { t, formatDateTime } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "needs_reply";
  const filters: Record<string, string | number | boolean | undefined> = {
    page: Number(params.get("page") || 1), page_size: 20,
    search: params.get("search") || undefined,
    patient: params.get("patient") || undefined,
    specialty: params.get("specialty") || undefined,
    consultation_status: params.get("status") || undefined,
    group: tab === "active" || tab === "closed" ? tab : undefined,
    priority: params.get("priority") || undefined,
    ordering: params.get("ordering") || "priority",
    patient_awaiting_response: tab === "needs_reply" ? true : undefined,
    unread_only: tab === "unread" ? true : undefined,
  };
  const query = useQuery({ queryKey: ["doctor-message-threads", filters], queryFn: () => doctorPhaseDApi.messages(filters) });
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page"); setParams(next);
  };
  return <div aria-busy={query.isLoading}>
    <PageHeader title={t("doctorD.messages.title")} actions={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{t("common.refresh")}</Button>} />
    <div role="tablist" aria-label={t("doctorD.messages.title")} className="mb-4 flex flex-wrap gap-2">
      {TABS.map(value => <Button key={value} size="sm" variant={tab === value ? "primary" : "secondary"} role="tab" aria-selected={tab === value} onClick={() => set("tab", value)}>{t(`doctorD.messages.tab.${value}`)}</Button>)}
    </div>
    <Card className="mb-4"><div className="grid gap-3 md:grid-cols-3">
      <Input label={t("common.search")} value={params.get("search") || ""} onChange={e => set("search", e.target.value)} />
      <Input label={t("doctorD.messages.patientId")} value={params.get("patient") || ""} onChange={e => set("patient", e.target.value)} />
      <Input label={t("doctorD.messages.specialtyId")} value={params.get("specialty") || ""} onChange={e => set("specialty", e.target.value)} />
      {["status", "priority", "ordering"].map(key => <Input key={key} label={t(`doctorD.messages.${key}`)} value={params.get(key) || ""} onChange={e => set(key, e.target.value)} />)}
    </div><Button className="mt-3" size="sm" variant="secondary" onClick={() => setParams({ tab })}>{t("common.clearFilters")}</Button></Card>
    {query.isLoading && <Spinner />}{query.isError && <ErrorState onRetry={() => query.refetch()} />}
    {query.data?.results.length === 0 && <EmptyState message={t("doctorD.messages.empty")} />}
    <div className="space-y-3">{query.data?.results.map(thread => <Card key={thread.consultation_id}>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div className="min-w-0">
        <h2 className="font-semibold">{thread.patient.display_name}</h2>
        <p className="text-sm text-slate-500">{thread.specialty?.name} · {t(`consultation.status.${thread.consultation_status}`)} · {thread.priority}</p>
        <p className="mt-2 truncate text-sm" dir="auto">{thread.last_message_preview || t("doctorD.messages.noPreview")}</p>
        <p className="mt-1 text-xs text-slate-500">{thread.last_message_at ? formatDateTime(thread.last_message_at) : ""}</p>
        {thread.patient_awaiting_response && <p className="text-sm font-medium text-amber-700">{t("doctorD.messages.awaiting")}</p>}
        {thread.unread_count > 0 && <p className="text-sm">{t("doctorD.messages.unread", { count: thread.unread_count })}</p>}
        {!thread.messaging_available && <p className="text-sm text-slate-500">{t("doctorD.messages.unavailable")}</p>}
      </div><Link className="font-medium text-primary-700 hover:underline" to={thread.action_path}>{t("doctorD.messages.open")}</Link></div>
    </Card>)}</div>
    {query.data && <nav className="mt-4 flex justify-between" aria-label={t("common.pagination")}><Button variant="secondary" disabled={!query.data.previous} onClick={() => set("page", String(Number(filters.page) - 1))}>{t("common.previous")}</Button><Button variant="secondary" disabled={!query.data.next} onClick={() => set("page", String(Number(filters.page) + 1))}>{t("common.next")}</Button></nav>}
  </div>;
}
