import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { medicalRecordsApi } from "../../api/medicalRecords";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";

export function PatientMedicalRecordListPage() {
  const { t, formatDate } = useI18n();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || "1");
  const filters = {
    page,
    status: params.get("status") || undefined,
    search: params.get("search") || undefined,
    doctor: params.get("doctor") || undefined,
    specialty: params.get("specialty") || undefined,
    created_after: params.get("created_after") || undefined,
    created_before: params.get("created_before") || undefined,
    ordering: params.get("ordering") || undefined,
  };
  const query = useQuery({
    queryKey: ["patient-medical-records", filters],
    queryFn: () => medicalRecordsApi.listMine(filters),
  });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <div>
      <PageHeader
        title={t("patientRecords.title")}
        actions={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{t("common.refresh")}</Button>}
      />
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            label={t("common.search")}
            value={params.get("search") || ""}
            onChange={(event) => update("search", event.target.value)}
          />
          <FilterSelect
            label={t("common.status")}
            value={params.get("status") || ""}
            onChange={(value) => update("status", value)}
            options={["", "finalized", "draft"]}
          />
          <FilterSelect
            label={t("common.ordering")}
            value={params.get("ordering") || ""}
            onChange={(value) => update("ordering", value)}
            options={["", "-updated_at", "updated_at", "-created_at", "created_at"]}
          />
          <Input
            label={t("patientRecords.doctorFilter")}
            value={params.get("doctor") || ""}
            onChange={(event) => update("doctor", event.target.value)}
          />
          <Input
            label={t("patientRecords.specialtyFilter")}
            value={params.get("specialty") || ""}
            onChange={(event) => update("specialty", event.target.value)}
          />
          <Input
            type="date"
            label={t("common.createdAfter")}
            value={params.get("created_after") || ""}
            onChange={(event) => update("created_after", event.target.value)}
          />
          <Input
            type="date"
            label={t("common.createdBefore")}
            value={params.get("created_before") || ""}
            onChange={(event) => update("created_before", event.target.value)}
          />
        </div>
      </Card>
      {query.isLoading && <Spinner />}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.results.length === 0 && <EmptyState message={t("patientRecords.empty")} />}
      <div className="grid gap-3">
        {query.data?.results.map((record) => (
          <Card key={record.id}>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{record.doctor.full_name}</h2>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">{t(`record.status.${record.status}`)}</span>
                </div>
                <p className="text-sm text-slate-500">{record.doctor.specialty_name}</p>
                <p className="mt-2 text-sm">{record.chief_complaint_summary || t("common.notAvailable")}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {t("patientRecords.created")}: {formatDate(record.created_at)}
                  {" · "}
                  {t("patientRecords.updated")}: {formatDate(record.updated_at)}
                  {record.finalized_at && <>{" · "}{t("patientRecords.finalized")}: {formatDate(record.finalized_at)}</>}
                </p>
              </div>
              <Link className="text-sm font-medium text-primary-700 hover:underline" to={`/app/patient/medical-records/${record.id}`}>
                {t("patientRecords.view")}
              </Link>
            </div>
          </Card>
        ))}
      </div>
      {query.data && query.data.count > query.data.results.length && (
        <nav className="mt-4 flex justify-between" aria-label={t("common.pagination")}>
          <Button variant="secondary" disabled={!query.data.previous} onClick={() => update("page", String(page - 1))}>{t("common.previous")}</Button>
          <Button variant="secondary" disabled={!query.data.next} onClick={() => update("page", String(page + 1))}>{t("common.next")}</Button>
        </nav>
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option || "—"}</option>)}
      </select>
    </label>
  );
}
