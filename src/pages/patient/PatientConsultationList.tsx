import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { consultationsApi, PatientConsultationFilters } from "../../api/consultations";
import { doctorsApi, specialtiesApi } from "../../api/doctors";
import { ConsultationStatusBadge } from "../../components/consultations/ConsultationStatusBadge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";
import { useI18n } from "../../i18n";

const tabs = [
  ["active", "active"],
  ["needs_action", "needsAction"],
  ["completed", "completed"],
  ["cancelled", "cancelled"],
  ["all", "all"],
] as const;

export function PatientConsultationList() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const group = params.get("group") || "active";
  const filters: PatientConsultationFilters = {
    status_group: group === "all" ? undefined : group as PatientConsultationFilters["status_group"],
    search: params.get("search") || undefined,
    doctor: params.get("doctor") || undefined,
    specialty: params.get("specialty") || undefined,
    created_after: params.get("from") || undefined,
    created_before: params.get("to") || undefined,
    has_unread_messages: params.get("unread") === "true" || undefined,
    ordering: params.get("ordering") || undefined,
    page: Number(params.get("page") || 1),
    page_size: 20,
  };
  const query = useQuery({
    queryKey: ["patient-consultations", filters],
    queryFn: () => consultationsApi.listPatient(filters),
  });
  const doctors = useQuery({
    queryKey: ["doctors", "phase-c-filter"],
    queryFn: () => doctorsApi.list({ page_size: 100 }),
  });
  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
  });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <main aria-busy={query.isLoading}>
      <PageHeader title={t("phaseC.list.title")} actions={
        <Link to="/app/patient/consultations/new"><Button>{t("consultation.new")}</Button></Link>
      } />
      <div role="tablist" aria-label={t("phaseC.list.tabs")} className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([value, label]) => (
          <button key={value} role="tab" aria-selected={group === value}
            onClick={() => update("group", value)}
            className={`rounded-full px-4 py-2 text-sm ${group === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
            {t(`phaseC.tab.${label}`)}
          </button>
        ))}
      </div>
      <section aria-label={t("phaseC.list.filters")} className="mb-5 grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">{t("common.search")}
          <input value={params.get("search") || ""} onChange={(e) => update("search", e.target.value)}
            className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm">{t("phaseC.filter.doctor")}
          <select value={params.get("doctor") || ""} onChange={(e) => update("doctor", e.target.value)}
            className="mt-1 w-full rounded-lg border p-2">
            <option value="">{t("phaseC.filter.allDoctors")}</option>
            {doctors.data?.results.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">{t("phaseC.filter.specialty")}
          <select value={params.get("specialty") || ""} onChange={(e) => update("specialty", e.target.value)}
            className="mt-1 w-full rounded-lg border p-2">
            <option value="">{t("doctor.allSpecialties")}</option>
            {specialties.data?.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">{t("phaseC.filter.from")}
          <input type="date" value={params.get("from") || ""} onChange={(e) => update("from", e.target.value)}
            className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm">{t("phaseC.filter.to")}
          <input type="date" value={params.get("to") || ""} onChange={(e) => update("to", e.target.value)}
            className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm">{t("phaseC.filter.ordering")}
          <select value={params.get("ordering") || ""} onChange={(e) => update("ordering", e.target.value)}
            className="mt-1 w-full rounded-lg border p-2">
            <option value="">{t("phaseC.order.action")}</option>
            <option value="-updated_at">{t("phaseC.order.updated")}</option>
            <option value="-created_at">{t("phaseC.order.created")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={params.get("unread") === "true"}
            onChange={(e) => update("unread", e.target.checked ? "true" : "")} />
          {t("phaseC.filter.unread")}
        </label>
      </section>

      {query.isLoading && <div role="status"><Spinner /></div>}
      {query.error && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.results.length === 0 && <EmptyState message={t("consultation.noResults")} />}
      <div className="grid gap-3">
        {query.data?.results.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">{item.doctor?.full_name || t("phaseC.doctor.unassigned")}</h2>
                <p className="text-sm text-slate-500">{item.specialty?.name || item.doctor?.specialty_name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ConsultationStatusBadge status={item.status} />
                  {item.needs_patient_action && <span className="text-sm font-medium text-amber-700">{t("phaseC.needsAction")}</span>}
                  {item.unread_messages > 0 && <span className="text-sm text-blue-700">{t("phaseC.unread", { count: item.unread_messages })}</span>}
                </div>
                <p className="mt-2 text-xs text-slate-500">{t("phaseC.updated", { date: new Date(item.updated_at).toLocaleDateString() })}</p>
              </div>
              <Link to={`/app/patient/consultations/${item.id}`}><Button variant="secondary">{t("common.view")}</Button></Link>
            </div>
          </Card>
        ))}
      </div>
      {query.data && (
        <nav className="mt-5 flex justify-between" aria-label={t("phaseC.pagination")}>
          <Button variant="secondary" disabled={!query.data.previous} onClick={() => update("page", String(Math.max(1, filters.page! - 1)))}>{t("common.previous")}</Button>
          <span>{t("common.page", { page: filters.page || 1 })}</span>
          <Button variant="secondary" disabled={!query.data.next} onClick={() => update("page", String(filters.page! + 1))}>{t("common.next")}</Button>
        </nav>
      )}
    </main>
  );
}
