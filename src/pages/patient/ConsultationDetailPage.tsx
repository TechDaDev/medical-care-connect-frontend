import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { attachmentsApi } from "../../api/attachments";
import { consultationsApi } from "../../api/consultations";
import { reviewsApi } from "../../api/reviews";
import { AttachmentList } from "../../components/attachments/AttachmentList";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { ConsultationStatusBadge } from "../../components/consultations/ConsultationStatusBadge";
import { ConsultationTimeline } from "../../components/consultations/ConsultationTimeline";
import { PatientConsultationActions } from "../../components/consultations/PatientConsultationActions";
import { ReviewCard } from "../../components/reviews/ReviewCard";
import { ReviewForm } from "../../components/reviews/ReviewForm";
import { useI18n } from "../../i18n";

export function ConsultationDetailPage() {
  const { consultationId = "" } = useParams<{ consultationId: string }>();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const detail = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => consultationsApi.getPatientById(consultationId),
    enabled: Boolean(consultationId),
  });
  const cancel = useMutation({
    mutationFn: () => consultationsApi.cancel(
      consultationId, cancelReason, detail.data!.status,
    ),
    onSuccess: (data) => {
      queryClient.setQueryData(["consultation", consultationId], data);
      queryClient.invalidateQueries({ queryKey: ["patient-consultations"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setCancelOpen(false);
      setCancelReason("");
    },
    onError: async (error: { response?: { status?: number; data?: { code?: string } } }) => {
      setCancelError(t(`phaseC.error.${error.response?.data?.code || "generic"}`));
      if (error.response?.status === 409) await detail.refetch();
    },
  });
  const status = (detail.error as { response?: { status?: number } } | null)?.response?.status;
  if (detail.isLoading) return <div role="status" aria-label={t("common.loading")}><Spinner /></div>;
  if (detail.error) return <ErrorState message={status === 403 ? t("error.forbidden") : status === 404 ? t("error.notFound") : undefined} onRetry={() => detail.refetch()} />;
  if (!detail.data) return null;
  const consultation = detail.data;

  return (
    <main className="mx-auto max-w-5xl space-y-6" aria-busy={detail.isFetching}>
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-bold">{t("phaseC.detail.title")}</h1>
          <p className="text-sm text-slate-500">{t("phaseC.updated", { date: new Date(consultation.updated_at).toLocaleString() })}</p>
        </div>
        <ConsultationStatusBadge status={consultation.status} />
      </header>
      <Card>
        <h2 className="text-lg font-semibold">{consultation.doctor?.full_name || t("phaseC.doctor.unassigned")}</h2>
        <p className="text-sm text-slate-500">{consultation.doctor?.professional_title}</p>
        <p className="text-sm text-slate-500">{consultation.specialty?.name}</p>
        <p className="mt-4 whitespace-pre-wrap">{consultation.description}</p>
      </Card>
      <Card><h2 className="mb-4 text-lg font-semibold">{t("phaseC.actions")}</h2>
        <PatientConsultationActions consultation={consultation} onCancel={() => { setCancelError(""); setCancelOpen(true); }} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-semibold">{t("phaseC.timeline")}</h2><ConsultationTimeline items={consultation.timeline} /></Card>
        <div className="space-y-4">
          <Summary title={t("intake.start")} value={`${consultation.intake_summary.question_count}`} action={
            consultation.actions.can_continue_intake ? <Link to={`/app/patient/consultations/${consultationId}/intake`}>{t("intake.continue")}</Link> : null} />
          <Summary title={t("message.title")} value={t("phaseC.unread", { count: consultation.messages_summary.unread_count })} action={
            consultation.actions.can_message ? <Link to={`/app/patient/messages/${consultationId}`}>{t("phaseC.open")}</Link> : null} />
          <Summary title={t("record.title")} value={consultation.medical_record_summary.status || t("record.noRecord")} action={
            consultation.medical_record_summary.id ? <Link to={`/app/patient/medical-records/${consultation.medical_record_summary.id}`}>{t("phaseC.open")}</Link> : null} />
        </div>
      </div>
      <AttachmentSection consultationId={consultationId} canUpload={consultation.actions.can_upload_attachment} />
      {(consultation.actions.can_write_review || consultation.review_summary.exists) && <ReviewSection consultationId={consultationId} canWrite={consultation.actions.can_write_review} />}
      <Card><h2 className="mb-3 text-lg font-semibold">{t("phaseC.metadata")}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">ID</dt><dd>{consultation.id}</dd></div>
          <div><dt className="text-slate-500">{t("consultation.createdAt")}</dt><dd>{new Date(consultation.created_at).toLocaleString()}</dd></div></dl>
      </Card>
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={t("consultation.cancel")}>
        <label className="text-sm" htmlFor="cancel-reason">{t("consultation.cancelReason")}</label>
        <textarea id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
          aria-invalid={Boolean(cancelError)} aria-describedby="cancel-error" rows={4} maxLength={500}
          className="mt-1 w-full rounded-lg border p-2" />
        <p className="text-xs text-slate-500">{cancelReason.length}/500</p>
        {cancelError && <p id="cancel-error" role="alert" className="text-sm text-red-700">{cancelError}</p>}
        <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setCancelOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="danger" disabled={cancelReason.trim().length < 10} loading={cancel.isPending} onClick={() => cancel.mutate()}>{t("common.confirm")}</Button></div>
      </Modal>
    </main>
  );
}

function Summary({ title, value, action }: { title: string; value: string; action: React.ReactNode }) {
  return <Card><h2 className="font-semibold">{title}</h2><p className="text-sm text-slate-500">{value}</p>{action && <div className="mt-2 text-sm font-medium text-blue-700">{action}</div>}</Card>;
}

function AttachmentSection({ consultationId, canUpload }: { consultationId: string; canUpload: boolean }) {
  const { t } = useI18n(); const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["attachments", consultationId], queryFn: () => attachmentsApi.list(consultationId) });
  return <Card><h2 className="mb-4 text-lg font-semibold">{t("attachment.title")}</h2>
    <AttachmentList attachments={query.data?.results || []} loading={query.isLoading} showUpload={canUpload}
      onUpload={async (file, category, description, signal) => { await attachmentsApi.upload(consultationId, file, category, description, undefined, signal); await queryClient.invalidateQueries({ queryKey: ["attachments", consultationId] }); await queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] }); }}
      onDownload={async (id) => { const { blob, filename } = await attachmentsApi.download(id); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }}
      onDelete={async (id) => { await attachmentsApi.delete(id); await queryClient.invalidateQueries({ queryKey: ["attachments", consultationId] }); }} />
  </Card>;
}

function ReviewSection({ consultationId, canWrite }: { consultationId: string; canWrite: boolean }) {
  const { t } = useI18n(); const queryClient = useQueryClient(); const [open, setOpen] = useState(false);
  const review = useQuery({ queryKey: ["review", consultationId], queryFn: () => reviewsApi.getReview(consultationId), retry: false });
  const create = useMutation({ mutationFn: (payload: Parameters<typeof reviewsApi.createReview>[1]) => reviewsApi.createReview(consultationId, payload),
    onSuccess: async () => { setOpen(false); await queryClient.invalidateQueries({ queryKey: ["review", consultationId] }); await queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] }); } });
  return <Card><h2 className="mb-4 text-lg font-semibold">{t("review.title")}</h2>
    {review.data ? <ReviewCard review={review.data} /> : canWrite && (open ? <ReviewForm onSubmit={(payload) => create.mutate(payload)} onCancel={() => setOpen(false)} isSubmitting={create.isPending} /> : <Button onClick={() => setOpen(true)}>{t("review.writeReview")}</Button>)}
  </Card>;
}
