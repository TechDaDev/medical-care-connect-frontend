import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { consultationsApi } from "../../api/consultations";
import { messagesApi } from "../../api/messages";
import { attachmentsApi } from "../../api/attachments";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Textarea } from "../../components/common/Textarea";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Modal } from "../../components/common/Modal";
import { AttachmentList } from "../../components/attachments/AttachmentList";
import { ConsultationStatusBadge } from "../../components/consultations/ConsultationStatusBadge";
import { ConsultationTimeline } from "../../components/consultations/ConsultationTimeline";
import type { DoctorConsultationDetail as DoctorDetail } from "../../types";

type WorkflowAction = "begin_review" | "request_patient_response" | "mark_awaiting_doctor" | "require_follow_up" | "require_physical_visit" | "transfer" | "complete";

const ACTIONS: Array<{ action: WorkflowAction; capability: keyof DoctorDetail["actions"]; reasonKey: string }> = [
  { action: "begin_review", capability: "can_begin_review", reasonKey: "begin_review" },
  { action: "mark_awaiting_doctor", capability: "can_mark_awaiting_doctor", reasonKey: "mark_awaiting_doctor" },
  { action: "request_patient_response", capability: "can_request_patient_response", reasonKey: "request_patient_response" },
  { action: "require_follow_up", capability: "can_require_follow_up", reasonKey: "follow_up" },
  { action: "require_physical_visit", capability: "can_require_physical_visit", reasonKey: "physical_visit" },
  { action: "transfer", capability: "can_transfer", reasonKey: "transfer" },
  { action: "complete", capability: "can_complete", reasonKey: "complete" },
];

export function DoctorConsultationDetail() {
  const { t, formatDateTime } = useI18n();
  const { consultationId } = useParams<{ consultationId: string }>();
  const queryClient = useQueryClient();
  const [dialogAction, setDialogAction] = useState<WorkflowAction | "accept" | null>(null);
  const [reason, setReason] = useState("");
  const [targetDoctorId, setTargetDoctorId] = useState("");
  const [showIntake, setShowIntake] = useState(false);

  const query = useQuery({
    queryKey: ["doctor-consultation", consultationId],
    queryFn: () => consultationsApi.getDoctorById(consultationId!),
    enabled: !!consultationId,
  });
  const intakeQuery = useQuery({
    queryKey: ["doctor-intake", consultationId],
    queryFn: () => consultationsApi.getDoctorIntake(consultationId!),
    enabled: !!consultationId && showIntake && !!query.data?.intake.exists,
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor-consultation", consultationId] }),
      queryClient.invalidateQueries({ queryKey: ["doctor-consultations"] }),
    ]);
  };
  const workflow = useMutation({
    mutationFn: async () => {
      const consultation = query.data!;
      if (dialogAction === "accept") {
        return consultationsApi.accept(consultation.id, consultation.status, consultation.updated_at);
      }
      return consultationsApi.transitionDoctor(consultation.id, {
        action: dialogAction!,
        reason: reason.trim() || undefined,
        target_doctor_id: targetDoctorId.trim() || undefined,
        expected_status: consultation.status,
        expected_updated_at: consultation.updated_at,
        client_request_id: crypto.randomUUID(),
      });
    },
    onSuccess: async () => {
      setDialogAction(null);
      setReason("");
      setTargetDoctorId("");
      await refresh();
    },
  });

  if (query.isLoading) return <Spinner />;
  if (query.error || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const consultation = query.data;

  return (
    <main className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><Link to="/app/doctor/consultations" className="text-sm font-medium text-primary-700 hover:underline">← {t("doctorPhaseB.backToQueue")}</Link><h1 className="mt-2 text-2xl font-bold text-slate-900">{t("doctorPhaseB.workspaceTitle")}</h1></div>
        <ConsultationStatusBadge status={consultation.status} />
      </header>

      {consultation.intake.emergency_detected && <div role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 font-medium text-red-900">{t("doctorPhaseB.emergencyWarning")}</div>}
      {workflow.error && <div role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">{t("doctorPhaseB.actionFailed")}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">{consultation.patient.display_name}</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Field label={t("doctorPhaseB.age")} value={consultation.patient.age?.toString()} />
              <Field label={t("doctorPhaseB.gender")} value={consultation.patient.gender} />
              <Field label={t("doctorPhaseB.language")} value={consultation.patient.preferred_language} />
              <Field label={t("doctorPhaseB.bloodType")} value={consultation.patient.blood_type} />
              <Field label={t("doctorPhaseB.specialty")} value={consultation.specialty?.name} />
              <Field label={t("doctorPhaseB.updated")} value={formatDateTime(consultation.updated_at)} />
            </dl>
            <div className="mt-4 border-t border-slate-200 pt-4"><h3 className="text-sm font-medium text-slate-600">{t("consultation.chiefComplaint")}</h3><p className="mt-1 whitespace-pre-wrap text-slate-900">{consultation.description || t("consultation.noDescription")}</p></div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{t("doctorPhaseB.intake")}</h2><Button variant="outline" size="sm" disabled={!consultation.intake.exists} onClick={() => setShowIntake((value) => !value)}>{showIntake ? t("common.hide") : t("common.view")}</Button></div>
            <p className="mt-2 text-sm text-slate-600">{consultation.intake.answered_count}/{consultation.intake.question_count} {t("doctorPhaseB.answers")}</p>
            {showIntake && intakeQuery.isLoading && <Spinner />}
            {showIntake && intakeQuery.error && <ErrorState onRetry={() => intakeQuery.refetch()} />}
            {showIntake && intakeQuery.data && <div className="mt-4 space-y-3">{intakeQuery.data.patient_answers.map((answer) => <div key={answer.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium text-slate-700">{answer.question_label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{answer.answer}</p></div>)}</div>}
          </Card>

          <InternalNotes consultationId={consultation.id} enabled={consultation.actions.can_add_internal_note} />
          <ConsultationAttachmentsSection consultationId={consultation.id} canUpload={consultation.attachments.can_upload} unavailableReason={consultation.attachments.upload_unavailable_reason} />
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">{t("doctorPhaseB.actions")}</h2>
            <div className="grid gap-2">
              <ActionButton label={t("consultation.accept")} enabled={consultation.actions.can_accept} reason={consultation.action_reasons.accept} onClick={() => setDialogAction("accept")} />
              {ACTIONS.map(({ action, capability, reasonKey }) => <ActionButton key={action} label={t(`doctorPhaseB.action.${action}`)} enabled={consultation.actions[capability]} reason={consultation.action_reasons[reasonKey]} onClick={() => setDialogAction(action)} />)}
              <Link aria-disabled={!consultation.actions.can_message} className={`rounded-lg border px-4 py-2 text-center text-sm font-medium ${consultation.actions.can_message ? "border-primary-600 text-primary-700 hover:bg-primary-50" : "pointer-events-none border-slate-200 text-slate-400"}`} to={`/app/doctor/messages/${consultation.id}`}>{t("message.title")}</Link>
            </div>
            {!consultation.medical_record.exists && <p className="mt-3 text-xs text-slate-500">{t("doctorPhaseB.recordPhaseC")}</p>}
          </Card>
          <Card><h2 className="mb-4 text-lg font-semibold">{t("doctorPhaseB.timeline")}</h2><ConsultationTimeline items={consultation.timeline} /></Card>
        </aside>
      </div>

      <Modal open={dialogAction !== null} onClose={() => !workflow.isPending && setDialogAction(null)} title={t(`doctorPhaseB.action.${dialogAction || "accept"}`)} closeLabel={t("common.close")}>
        <form onSubmit={(event) => { event.preventDefault(); workflow.mutate(); }} className="space-y-4">
          {dialogAction !== "accept" && <Textarea label={t("doctorPhaseB.reason")} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={4} required={["request_patient_response", "require_follow_up", "require_physical_visit", "transfer", "complete"].includes(dialogAction || "")} />}
          {dialogAction === "transfer" && <Input label={t("doctorPhaseB.targetDoctorId")} value={targetDoctorId} onChange={(event) => setTargetDoctorId(event.target.value)} required />}
          <p className="text-sm text-slate-600">{t("doctorPhaseB.confirmAction")}</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogAction(null)} disabled={workflow.isPending}>{t("common.cancel")}</Button><Button type="submit" loading={workflow.isPending}>{t("common.confirm")}</Button></div>
        </form>
      </Modal>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-900">{value || "—"}</dd></div>;
}

function ActionButton({ label, enabled, reason, onClick }: { label: string; enabled: boolean; reason?: string | null; onClick: () => void }) {
  return <div><Button className="w-full" variant="outline" disabled={!enabled} title={!enabled && reason ? reason : undefined} onClick={onClick}>{label}</Button>{!enabled && reason && <p className="mt-1 text-xs text-slate-500">{reason.replaceAll("_", " ")}</p>}</div>;
}

function InternalNotes({ consultationId, enabled }: { consultationId: string; enabled: boolean }) {
  const { t, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const query = useQuery({ queryKey: ["internal-notes", consultationId], queryFn: () => messagesApi.listInternalNotes(consultationId), enabled });
  const mutation = useMutation({ mutationFn: () => messagesApi.createInternalNote(consultationId, content.trim()), onSuccess: async () => { setContent(""); await queryClient.invalidateQueries({ queryKey: ["internal-notes", consultationId] }); } });
  if (!enabled) return null;
  return <Card><h2 className="text-lg font-semibold">{t("consultation.internalNotes")}</h2><p className="mt-1 text-xs text-amber-800">{t("doctorPhaseB.notesPrivate")}</p>{query.error && <ErrorState onRetry={() => query.refetch()} />}
    <div className="my-4 space-y-2">{query.data?.results.map((note) => <article key={note.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="whitespace-pre-wrap text-sm text-amber-950">{note.content}</p><p className="mt-1 text-xs text-amber-800">{note.author.display_name} · {formatDateTime(note.created_at)}</p></article>)}</div>
    {mutation.error && <p role="alert" className="mb-2 text-sm text-red-700">{t("doctorPhaseB.noteFailed")}</p>}
    <Textarea label={t("consultation.addInternalNote")} value={content} onChange={(event) => setContent(event.target.value)} minLength={10} maxLength={5000} rows={3} />
    <Button className="mt-3" onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={content.trim().length < 10}>{t("common.save")}</Button>
  </Card>;
}

function ConsultationAttachmentsSection({ consultationId, canUpload, unavailableReason }: { consultationId: string; canUpload: boolean; unavailableReason: string | null }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["attachments", consultationId], queryFn: () => attachmentsApi.list(consultationId) });
  const triggerDownload = async (id: string) => { try { const { blob, filename } = await attachmentsApi.download(id); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); } catch { setError(t("attachment.error.not_available")); } };
  const confirmDelete = async () => { if (!deleteId) return; try { await attachmentsApi.delete(deleteId); setDeleteId(null); await queryClient.invalidateQueries({ queryKey: ["attachments", consultationId] }); } catch { setError(t("attachment.error.permission")); } };
  const upload = async (file: File, category: string, description: string, signal: AbortSignal) => { await attachmentsApi.upload(consultationId, file, category, description, undefined, signal); await queryClient.invalidateQueries({ queryKey: ["attachments", consultationId] }); };
  return <Card><h2 className="mb-4 text-lg font-semibold">{t("attachment.title")}</h2>{error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}{!canUpload && unavailableReason && <p className="mb-3 text-sm text-slate-500">{unavailableReason.replaceAll("_", " ")}</p>}<AttachmentList attachments={query.data?.results || []} loading={query.isLoading} onUpload={upload} onDownload={triggerDownload} onDelete={setDeleteId} showUpload={canUpload} />
    <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title={t("attachment.deleteConfirm")} closeLabel={t("common.close")}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteId(null)}>{t("common.cancel")}</Button><Button variant="danger" onClick={confirmDelete}>{t("common.confirm")}</Button></div></Modal>
  </Card>;
}
