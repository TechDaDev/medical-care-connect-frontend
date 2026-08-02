import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorPhaseDApi } from "../../api/doctorPhaseD";
import type { Notification } from "../../types";
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Spinner } from "../../components/common";
import { useI18n } from "../../i18n";

const SAFE = /^\/app\/doctor\/(consultations|messages|medical-records)\/[0-9a-f-]+\/?$|^\/app\/doctor\/(reviews|profile|privacy(?:\/deletion)?)\/?$/i;

export function DoctorNotificationsPage() {
  const { t, formatDateTime } = useI18n(); const navigate = useNavigate(); const qc = useQueryClient();
  const [params, setParams] = useSearchParams(); const [status, setStatus] = useState("");
  const filters = { page: Number(params.get("page") || 1), unread: params.get("unread") || undefined, type: params.get("type") || undefined, created_after: params.get("after") || undefined, created_before: params.get("before") || undefined, ordering: params.get("ordering") || "-created_at" };
  const query = useQuery({ queryKey: ["doctor-notifications", filters], queryFn: () => doctorPhaseDApi.notifications(filters) });
  const invalidate = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["doctor-notifications"] }), qc.invalidateQueries({ queryKey: ["doctor-dashboard"] })]); };
  const one = useMutation({ mutationFn: doctorPhaseDApi.markNotificationRead, onSuccess: invalidate });
  const all = useMutation({ mutationFn: doctorPhaseDApi.markAllNotificationsRead, onSuccess: async data => { setStatus(t("doctorD.notifications.marked", { count: data.marked_read })); await invalidate(); } });
  const set = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== "page") next.delete("page"); setParams(next); };
  const open = async (item: Notification) => { if (!item.is_read) await one.mutateAsync(item.id); const path = item.link.path; if (path && SAFE.test(path)) navigate(path); else setStatus(t("doctorD.notifications.unsafe")); };
  return <div aria-busy={query.isLoading}>
    <PageHeader title={t("doctorD.notifications.title")} actions={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{t("common.refresh")}</Button>} />
    <p className="sr-only" role="status" aria-live="polite">{status}</p>
    <Card className="mb-4"><div className="grid gap-3 md:grid-cols-4">
      <label className="text-sm font-medium">{t("common.status")}<select className="mt-1 w-full rounded-lg border p-2" value={params.get("unread") || ""} onChange={e => set("unread", e.target.value)}><option value="">{t("common.all")}</option><option value="true">{t("doctorD.notifications.unread")}</option></select></label>
      <Input label={t("doctorD.notifications.type")} value={params.get("type") || ""} onChange={e => set("type", e.target.value)} />
      <Input type="date" label={t("common.createdAfter")} value={params.get("after") || ""} onChange={e => set("after", e.target.value)} />
      <Input type="date" label={t("common.createdBefore")} value={params.get("before") || ""} onChange={e => set("before", e.target.value)} />
    </div><Button className="mt-3" size="sm" variant="secondary" disabled={!query.data?.unread_count} loading={all.isPending} onClick={() => all.mutate()}>{t("doctorD.notifications.markAll")}</Button></Card>
    {query.isLoading && <Spinner />}{query.isError && <ErrorState onRetry={() => query.refetch()} />}{query.data?.results.length === 0 && <EmptyState message={t("doctorD.notifications.empty")} />}
    <div className="space-y-2">{query.data?.results.map(item => <Card key={item.id} className={item.is_read ? "bg-slate-50" : "border-primary-300"}><button className="w-full text-start" onClick={() => open(item)} aria-label={`${item.title}. ${item.is_read ? t("doctorD.notifications.read") : t("doctorD.notifications.unread")}`}><h2 className="font-medium">{item.title}</h2><p className="text-sm text-slate-600" dir="auto">{item.body}</p><p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p></button></Card>)}</div>
    {query.data && <nav className="mt-4 flex justify-between"><Button variant="secondary" disabled={!query.data.previous} onClick={() => set("page", String(filters.page - 1))}>{t("common.previous")}</Button><Button variant="secondary" disabled={!query.data.next} onClick={() => set("page", String(filters.page + 1))}>{t("common.next")}</Button></nav>}
  </div>;
}
