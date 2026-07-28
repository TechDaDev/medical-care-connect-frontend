import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { medicalRecordsApi } from "../../api/medicalRecords";
import { useI18n } from "../../i18n";
import { Alert } from "../../components/common/Alert";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";

export function PatientMedicalRecordPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const { t, formatDateTime } = useI18n();
  const query = useQuery({
    queryKey: ["patient-medical-record", recordId],
    queryFn: () => medicalRecordsApi.getMine(recordId!),
    enabled: Boolean(recordId),
  });
  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const record = query.data;
  const fields: Array<[string, string | string[] | number | null]> = [
    [t("record.field.chiefComplaint"), record.chief_complaint],
    [t("record.field.history"), record.history_of_present_illness],
    [t("record.field.symptoms"), record.symptoms],
    [t("record.field.duration"), record.duration],
    [t("record.field.severity"), record.severity],
    [t("record.field.onset"), record.onset_date],
    [t("record.field.location"), record.location],
    [t("record.field.triggers"), record.triggers],
    [t("record.field.relief"), record.relieving_factors],
    [t("record.field.pastHistory"), record.past_medical_history],
    [t("record.field.medications"), record.medications],
    [t("record.field.allergies"), record.allergies],
    [t("record.field.familyHistory"), record.family_history],
    [t("record.field.socialHistory"), record.social_history],
    [t("record.field.reviewSystems"), record.review_of_systems],
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("patientRecords.detailTitle")} />
      <Alert variant={record.status === "finalized" ? "success" : "info"}>{t(`record.status.${record.status}`)}</Alert>
      <Card className="mt-4">
        <dl className="grid gap-4 md:grid-cols-2">
          <Definition label={t("patientRecords.doctor")} value={record.doctor.full_name} />
          <Definition label={t("patientRecords.specialty")} value={record.doctor.specialty_name} />
          <Definition label={t("patientRecords.consultation")} value={record.consultation_id} />
          <Definition label={t("patientRecords.created")} value={formatDateTime(record.created_at)} />
          <Definition label={t("patientRecords.updated")} value={formatDateTime(record.updated_at)} />
          <Definition label={t("patientRecords.finalized")} value={record.finalized_at ? formatDateTime(record.finalized_at) : null} />
          {fields.map(([label, value]) => <Definition key={label} label={label} value={value} />)}
        </dl>
      </Card>
      <p className="mt-4 text-sm text-slate-500">{t("patientRecords.privacyNotice")}</p>
    </div>
  );
}

function Definition({ label, value }: { label: string; value: string | string[] | number | null }) {
  const display = Array.isArray(value) ? value.join(", ") : value;
  if (display === null || display === undefined || display === "") return null;
  return <div><dt className="text-sm font-medium text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{display}</dd></div>;
}
