import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicalRecordsApi } from "../../api/medicalRecords";
import type { DoctorRecordAuthoredFields } from "../../types";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Textarea } from "../../components/common/Textarea";
import { ApiRequestError } from "../../utils/errors";

const FIELDS: Array<keyof DoctorRecordAuthoredFields> = ["clinical_summary", "assessment", "working_diagnosis", "differential_considerations", "recommendations", "treatment_plan", "follow_up_plan", "physical_visit_reason", "warning_signs", "patient_instructions", "doctor_notes"];
const REQUIRED = new Set<keyof DoctorRecordAuthoredFields>(["patient_instructions"]);

export function DoctorMedicalRecordPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const { t, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const conflictRef = useRef<HTMLDivElement>(null);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["doctor-medical-record", recordId], queryFn: () => medicalRecordsApi.getDoctorMedicalRecord(recordId!), enabled: !!recordId });
  const form = useForm<DoctorRecordAuthoredFields>({ defaultValues: emptyFields() });

  useEffect(() => { if (query.data && !conflict) form.reset(query.data.doctor_authored); }, [query.data, conflict, form]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (form.formState.isDirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form.formState.isDirty]);
  useEffect(() => { if (conflict) conflictRef.current?.focus(); }, [conflict]);

  const refreshScoped = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["doctor-medical-records"] }),
    queryClient.invalidateQueries({ queryKey: ["doctor-consultation", query.data?.consultation_id] }),
    queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] }),
  ]);
  const save = useMutation({
    mutationFn: (values: DoctorRecordAuthoredFields) => {
      const dirty = form.formState.dirtyFields;
      const changed = Object.fromEntries(FIELDS.filter((field) => dirty[field]).map((field) => [field, values[field]]));
      return medicalRecordsApi.updateDoctorMedicalRecord(recordId!, { doctor_authored: changed, expected_version: query.data!.version, client_request_id: crypto.randomUUID() });
    },
    onSuccess: async (record) => { setConflict(false); setSavedAt(record.updated_at); form.reset(record.doctor_authored); queryClient.setQueryData(["doctor-medical-record", recordId], record); await refreshScoped(); },
    onError: (error) => { if (error instanceof ApiRequestError && error.status === 409) setConflict(true); },
  });
  const finalize = useMutation({
    mutationFn: () => medicalRecordsApi.finalizeDoctorMedicalRecord(recordId!, { expected_version: query.data!.version, client_request_id: crypto.randomUUID(), confirmation: confirmed }),
    onSuccess: async (record) => { setFinalizeOpen(false); setConfirmed(false); queryClient.setQueryData(["doctor-medical-record", recordId], record); form.reset(record.doctor_authored); await refreshScoped(); },
    onError: (error) => { if (error instanceof ApiRequestError && error.status === 409) { setFinalizeOpen(false); setConflict(true); } },
  });
  const patientValues = useMemo(() => query.data ? Object.entries(query.data.patient_reported) : [], [query.data]);

  if (query.isLoading) return <div role="status" aria-label={t("common.loading")}><Spinner /></div>;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const record = query.data;
  const editable = record.actions.can_edit;

  return <main className="mx-auto max-w-6xl print:max-w-none">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3 print:block"><div><Link className="print:hidden text-sm font-medium text-primary-700 hover:underline" to="/app/doctor/medical-records">← {t("doctorRecords.back")}</Link><h1 className="mt-2 text-2xl font-bold">{t("doctorRecord.title")}</h1><p className="mt-1 text-sm text-slate-600">{record.patient.display_name} · {t(`record.status.${record.record_status}`)}</p></div>{record.actions.can_print && <Button className="print:hidden" variant="secondary" onClick={() => window.print()}>{t("doctorRecord.print")}</Button>}</header>
    {conflict && <div ref={conflictRef} tabIndex={-1} role="alert" className="mb-4 rounded-xl border border-amber-400 bg-amber-50 p-4"><h2 className="font-semibold">{t("doctorRecord.conflict")}</h2><p className="mt-1 text-sm">{t("doctorRecord.conflictHelp")}</p><Button className="mt-3" variant="secondary" onClick={async () => { setConflict(false); save.reset(); finalize.reset(); await query.refetch(); }}>{t("doctorRecord.reloadLatest")}</Button></div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="space-y-5">
        <Card><h2 className="text-lg font-semibold">{t("doctorRecord.context")}</h2><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><ReadOnly label={t("doctorRecord.specialty")} value={record.consultation.specialty_name} /><ReadOnly label={t("doctorRecord.consultationStatus")} value={t(`consultation.status.${record.consultation.status}`)} /><ReadOnly label={t("doctorRecord.language")} value={record.patient.preferred_language} /><ReadOnly label={t("doctorRecord.updated")} value={formatDateTime(record.updated_at)} /></dl></Card>
        <Card><section aria-labelledby="patient-reported"><h2 id="patient-reported" className="text-lg font-semibold">{t("doctorRecord.patientReported")}</h2><p className="text-xs text-slate-500">{t("doctorRecord.readOnly")}</p><dl className="mt-3 grid gap-3 sm:grid-cols-2">{patientValues.map(([key, value]) => <ReadOnly key={key} label={t(`doctorRecord.patient.${key}`)} value={Array.isArray(value) ? value.join(", ") : value === null ? null : String(value)} />)}</dl></section></Card>
        <Card className="print:hidden"><h2 className="text-lg font-semibold">{t("doctorRecord.intake")}</h2><p className="mt-2 text-sm text-slate-600">{record.intake_reference.exists ? t("doctorRecord.intakeAvailable") : t("common.notAvailable")}</p>{record.intake_reference.action_path && <Link className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline" to={record.intake_reference.action_path}>{t("common.view")}</Link>}</Card>
        <Card className="print:hidden border-dashed"><h2 className="text-lg font-semibold">{t("doctorRecord.aiSuggestions")}</h2><p className="mt-2 text-sm text-slate-600">{record.ai_suggestions.available ? t("doctorRecord.reviewAi") : t("doctorRecord.aiUnavailable")}</p></Card>
        <form id="doctor-record-form" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <Card><fieldset disabled={!editable || save.isPending} className="space-y-4"><legend className="mb-3 text-lg font-semibold">{t("doctorRecord.doctorAuthored")}</legend>{FIELDS.map((field) => <Textarea key={field} id={`record-${field}`} label={`${t(`doctorRecord.field.${field}`)}${REQUIRED.has(field) ? " *" : ""}`} rows={field === "doctor_notes" ? 3 : 5} maxLength={5000} error={form.formState.errors[field]?.message} {...form.register(field, { required: REQUIRED.has(field) ? t("doctorRecord.required") : false })} />)}</fieldset></Card>
        </form>
      </div>
      <aside className="space-y-5 print:hidden">
        <Card><h2 className="text-lg font-semibold">{t("doctorRecord.validation")}</h2>{record.record_status === "finalized" ? <p className="mt-2 text-sm text-emerald-700">{t("doctorRecord.finalized")}</p> : record.validation.can_finalize ? <p className="mt-2 text-sm text-emerald-700">{t("doctorRecord.ready")}</p> : <div role="alert" className="mt-2 text-sm text-amber-800"><p>{t("doctorRecord.incomplete")}</p><ul className="mt-2 list-disc ps-5">{record.validation.missing_fields.map((field) => <li key={field}><a href={`#record-${field}`}>{t(`doctorRecord.field.${field}`)}</a></li>)}</ul></div>}</Card>
        <Card><h2 className="text-lg font-semibold">{t("doctorRecord.actions")}</h2><div className="mt-3 grid gap-3"><Button form="doctor-record-form" type="submit" loading={save.isPending} disabled={!editable || !form.formState.isDirty}>{t("doctorRecord.saveDraft")}</Button><Button variant="secondary" disabled={!record.actions.can_finalize} onClick={() => setFinalizeOpen(true)}>{t("doctorRecord.finalize")}</Button></div>{form.formState.isDirty && <p role="status" className="mt-2 text-sm text-amber-800">{t("doctorRecord.unsaved")}</p>}{savedAt && !form.formState.isDirty && <p role="status" className="mt-2 text-sm text-emerald-700">{t("doctorRecord.lastSaved", { date: formatDateTime(savedAt) })}</p>}{save.isError && !conflict && <p role="alert" className="mt-2 text-sm text-red-700">{t("doctorRecord.saveFailed")}</p>}</Card>
        <Card><h2 className="text-lg font-semibold">{t("doctorRecord.history")}</h2><dl className="mt-3 space-y-2 text-sm"><ReadOnly label={t("doctorRecord.version")} value={String(record.version)} /><ReadOnly label={t("doctorRecord.created")} value={formatDateTime(record.created_at)} /><ReadOnly label={t("doctorRecord.finalizedBy")} value={record.finalized_by?.display_name} /></dl></Card>
      </aside>
    </div>
    <Modal open={finalizeOpen} onClose={() => !finalize.isPending && setFinalizeOpen(false)} title={t("doctorRecord.confirmFinalize")} closeLabel={t("common.close")}><div className="space-y-4"><p id="finalize-description" className="text-sm text-slate-700">{t("doctorRecord.finalizeWarning")}</p>{!record.validation.can_finalize && <p role="alert" className="text-sm text-red-700">{t("doctorRecord.incomplete")}</p>}<label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span className="text-sm">{t("doctorRecord.confirmation")}</span></label>{finalize.isError && !conflict && <p role="alert" className="text-sm text-red-700">{t("doctorRecord.finalizeFailed")}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setFinalizeOpen(false)} disabled={finalize.isPending}>{t("common.cancel")}</Button><Button onClick={() => finalize.mutate()} loading={finalize.isPending} disabled={!confirmed || !record.validation.can_finalize}>{t("doctorRecord.finalize")}</Button></div></div></Modal>
  </main>;
}

function emptyFields(): DoctorRecordAuthoredFields { return { clinical_summary: "", assessment: "", working_diagnosis: "", differential_considerations: "", recommendations: "", treatment_plan: "", follow_up_plan: "", physical_visit_reason: "", warning_signs: "", patient_instructions: "", doctor_notes: "" }; }
function ReadOnly({ label, value }: { label: string; value?: string | null }) { return <div><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{value || "—"}</dd></div>; }
