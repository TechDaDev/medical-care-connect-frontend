import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { medicalRecordsApi } from "../../api/medicalRecords";
import type { DoctorRecordListFilters } from "../../types";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { PageHeader } from "../../components/common/PageHeader";
import { Select } from "../../components/common/Select";
import { Spinner } from "../../components/common/Spinner";

const TABS = ["all", "draft", "finalized", "needs_action"] as const;

export function DoctorMedicalRecordListPage() {
  const { t, formatDateTime } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "all";
  const page = Math.max(1, Number(params.get("page") || "1"));
  const filters: DoctorRecordListFilters = {
    page,
    record_status: tab === "draft" || tab === "finalized" ? tab : params.get("record_status") || undefined,
    needs_doctor_action: tab === "needs_action" ? true : undefined,
    consultation_status: params.get("consultation_status") || undefined,
    patient: params.get("patient") || undefined,
    specialty: params.get("specialty") || undefined,
    created_after: params.get("created_after") || undefined,
    created_before: params.get("created_before") || undefined,
    search: params.get("search") || undefined,
    ordering: params.get("ordering") || "-updated_at",
  };
  const query = useQuery({
    queryKey: ["doctor-medical-records", filters],
    queryFn: () => medicalRecordsApi.listDoctorMedicalRecords(filters),
  });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  const clear = () => setParams(new URLSearchParams());

  return <main aria-busy={query.isLoading}>
    <PageHeader title={t("doctorRecords.title")} actions={<Button variant="secondary" size="sm" onClick={() => query.refetch()}>{t("common.refresh")}</Button>} />
    <nav aria-label={t("doctorRecords.tabs")} className="mb-4 flex flex-wrap gap-2">
      {TABS.map((value) => <Button key={value} size="sm" variant={tab === value ? "primary" : "secondary"} onClick={() => update("tab", value)}>{t(`doctorRecords.tab.${value}`)}</Button>)}
    </nav>
    <Card className="mb-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input label={t("common.search")} value={params.get("search") || ""} onChange={(event) => update("search", event.target.value)} />
        <Input label={t("doctorRecords.patientId")} value={params.get("patient") || ""} onChange={(event) => update("patient", event.target.value)} />
        <Input label={t("doctorRecords.specialtyId")} value={params.get("specialty") || ""} onChange={(event) => update("specialty", event.target.value)} />
        <Select label={t("doctorRecords.consultationStatus")} value={params.get("consultation_status") || ""} onChange={(event) => update("consultation_status", event.target.value)} placeholder={t("common.all")} options={["doctor_review", "awaiting_patient_response", "awaiting_doctor_response", "under_review", "follow_up_required", "physical_visit_required", "transferred", "completed"].map((value) => ({ value, label: t(`consultation.status.${value}`) }))} />
        <Input type="date" label={t("common.createdAfter")} value={params.get("created_after") || ""} onChange={(event) => update("created_after", event.target.value)} />
        <Input type="date" label={t("common.createdBefore")} value={params.get("created_before") || ""} onChange={(event) => update("created_before", event.target.value)} />
        <Select label={t("common.ordering")} value={params.get("ordering") || "-updated_at"} onChange={(event) => update("ordering", event.target.value)} options={["-updated_at", "updated_at", "-created_at", "created_at", "status"].map((value) => ({ value, label: t(`doctorRecords.order.${value}`) }))} />
        <div className="flex items-end"><Button variant="secondary" onClick={clear}>{t("common.clearFilters")}</Button></div>
      </div>
    </Card>
    {query.isLoading && <div role="status" aria-label={t("common.loading")} className="py-10"><Spinner /></div>}
    {query.isError && <ErrorState onRetry={() => query.refetch()} />}
    {query.data?.results.length === 0 && <EmptyState message={t("doctorRecords.empty")} />}
    <div className="space-y-3 md:hidden">
      {query.data?.results.map((record) => <Card key={record.id}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{record.patient.display_name}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{t(`record.status.${record.record_status}`)}</span></div>
            <p className="mt-1 text-sm text-slate-600">{record.specialty?.name || t("common.notAvailable")} · {t(`consultation.status.${record.consultation_status}`)}</p>
            <p className="mt-1 text-xs text-slate-500">{t("doctorRecords.updated", { date: formatDateTime(record.updated_at) })}</p>
            {record.completion_blocked_reason && <p className="mt-1 text-xs text-amber-800">{t(`doctorRecords.reason.${record.completion_blocked_reason}`)}</p>}
          </div>
          <Link className="rounded-lg border border-primary-600 px-4 py-2 text-center text-sm font-medium text-primary-700 hover:bg-primary-50" to={`/app/doctor/medical-records/${record.id}`}>{record.record_status === "draft" ? t("doctorRecords.continue") : t("doctorRecords.viewFinal")}</Link>
        </div>
      </Card>)}
    </div>
    {query.data && query.data.results.length > 0 && <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-start text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr><th scope="col" className="px-4 py-3 text-start">{t("doctorRecords.patientId")}</th><th scope="col" className="px-4 py-3 text-start">{t("doctorRecord.specialty")}</th><th scope="col" className="px-4 py-3 text-start">{t("doctorRecord.consultationStatus")}</th><th scope="col" className="px-4 py-3 text-start">{t("doctorRecords.updatedColumn")}</th><th scope="col" className="px-4 py-3 text-end">{t("doctorRecord.actions")}</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {query.data.results.map((record) => <tr key={record.id}>
            <td className="px-4 py-3"><span className="font-medium text-slate-900">{record.patient.display_name}</span><span className="ms-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{t(`record.status.${record.record_status}`)}</span>{record.completion_blocked_reason && <p className="mt-1 text-xs text-amber-800">{t(`doctorRecords.reason.${record.completion_blocked_reason}`)}</p>}</td>
            <td className="px-4 py-3 text-slate-700">{record.specialty?.name || t("common.notAvailable")}</td>
            <td className="px-4 py-3 text-slate-700">{t(`consultation.status.${record.consultation_status}`)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(record.updated_at)}</td>
            <td className="px-4 py-3 text-end"><Link className="inline-block rounded-lg border border-primary-600 px-3 py-2 font-medium text-primary-700 hover:bg-primary-50" to={`/app/doctor/medical-records/${record.id}`}>{record.record_status === "draft" ? t("doctorRecords.continue") : t("doctorRecords.viewFinal")}</Link></td>
          </tr>)}
        </tbody>
      </table>
    </div>}
    {query.data && (query.data.next || query.data.previous) && <nav aria-label={t("common.pagination")} className="mt-5 flex justify-between"><Button variant="secondary" disabled={!query.data.previous} onClick={() => update("page", String(page - 1))}>{t("common.previous")}</Button><Button variant="secondary" disabled={!query.data.next} onClick={() => update("page", String(page + 1))}>{t("common.next")}</Button></nav>}
  </main>;
}
