import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "../../api/patients";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";

export function PatientMessagesPage() {
  const { t, formatDateTime } = useI18n();
  const [params, setParams] = useSearchParams();
  const filters = {
    page: Number(params.get("page") || "1"),
    search: params.get("search") || undefined,
    doctor: params.get("doctor") || undefined,
    unread_only: params.get("unread_only") || undefined,
    consultation_status: params.get("consultation_status") || undefined,
  };
  const query = useQuery({
    queryKey: ["patient-message-threads", filters],
    queryFn: () => patientsApi.listMessageThreads(filters),
  });
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <div>
      <PageHeader title={t("patientMessages.title")} actions={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{t("common.refresh")}</Button>} />
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input label={t("common.search")} value={params.get("search") || ""} onChange={(event) => set("search", event.target.value)} />
          <Input label={t("patientRecords.doctorFilter")} value={params.get("doctor") || ""} onChange={(event) => set("doctor", event.target.value)} />
          <label className="text-sm font-medium text-slate-700">
            {t("common.status")}
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={params.get("consultation_status") || ""} onChange={(event) => set("consultation_status", event.target.value)}>
              <option value="">{t("common.all")}</option>
              {["submitted", "accepted", "doctor_review", "awaiting_patient_response", "awaiting_doctor_response", "completed", "cancelled"].map((status) => (
                <option key={status} value={status}>{t(`consultation.status.${status}`)}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end py-2 text-sm">
            <input type="checkbox" checked={params.get("unread_only") === "true"} onChange={(event) => set("unread_only", event.target.checked ? "true" : "")} />
            {t("patientMessages.unreadOnly")}
          </label>
        </div>
      </Card>
      {query.isLoading && <Spinner />}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.results.length === 0 && <EmptyState message={t("patientMessages.empty")} />}
      <div className="space-y-3">
        {query.data?.results.map((thread) => (
          <Card key={thread.consultation_id} className={thread.unread_count ? "border-primary-300" : ""}>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{thread.doctor?.full_name || t("common.notAvailable")}</h2>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{t(`consultation.status.${thread.consultation_status}`)}</span>
                  {thread.unread_count > 0 && <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs text-white" aria-label={t("patientMessages.unreadCount", { count: thread.unread_count })}>{thread.unread_count}</span>}
                </div>
                <p className="text-sm text-slate-500">{thread.doctor?.specialty_name}</p>
                <p className="mt-2 truncate text-sm">{thread.last_message_preview || t("patientMessages.noPreview")}</p>
                {thread.last_message_at && <p className="mt-1 text-xs text-slate-500">{formatDateTime(thread.last_message_at)}</p>}
                {!thread.messaging_available && <p className="mt-1 text-xs text-slate-500">{t("patientMessages.closed")}</p>}
              </div>
              <Link className="text-sm font-medium text-primary-700 hover:underline" to={`/app/patient/messages/${thread.consultation_id}`}>{t("patientMessages.open")}</Link>
            </div>
          </Card>
        ))}
      </div>
      {query.data && query.data.count > 0 && (
        <nav className="mt-4 flex justify-between" aria-label={t("common.pagination")}>
          <Button variant="secondary" disabled={!query.data.previous} onClick={() => set("page", String(filters.page - 1))}>{t("common.previous")}</Button>
          <Button variant="secondary" disabled={!query.data.next} onClick={() => set("page", String(filters.page + 1))}>{t("common.next")}</Button>
        </nav>
      )}
    </div>
  );
}
