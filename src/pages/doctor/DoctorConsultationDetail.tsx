import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { consultationsApi } from "../../api/consultations";
import { messagesApi } from "../../api/messages";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Textarea } from "../../components/common/Textarea";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { AttachmentList } from "../../components/attachments/AttachmentList";
import { attachmentsApi } from "../../api/attachments";

export function DoctorConsultationDetail() {
  const { t } = useI18n();
  const { consultationId } = useParams<{ consultationId: string }>();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => consultationsApi.getById(consultationId!),
    enabled: !!consultationId,
  });

  const { data: internalNotes } = useQuery({
    queryKey: ["internal-notes", consultationId],
    queryFn: () => messagesApi.listInternalNotes(consultationId!),
    enabled: !!consultationId,
  });

  const acceptMutation = useMutation({
    mutationFn: () => consultationsApi.accept(consultationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] });
    },
  });

  const noteMutation = useMutation({
    mutationFn: () => messagesApi.createInternalNote(consultationId!, noteContent),
    onSuccess: () => {
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["internal-notes", consultationId] });
    },
  });

  if (isLoading) return <Spinner />;
  if (!consultation) return <ErrorState />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("consultation.title")}
        </h1>
        <Badge variant="info">
          {consultation.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <AvatarFallback
            name={consultation.patient.user.full_name}
            size="md"
          />
          <div>
            <p className="font-medium text-gray-900">
              {consultation.patient.user.full_name}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500">
              {t("consultation.chiefComplaint")}:
            </span>{" "}
            <span className="text-gray-900">
              {consultation.description || t("consultation.noDescription")}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 mb-6">
        {consultation.actions?.can_accept && (
          <Button
            loading={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
          >
            {t("consultation.accept")}
          </Button>
        )}
        {consultation.actions?.can_message && (
          <Link to={`/app/doctor/messages/${consultationId}`}>
            <Button variant="secondary">{t("message.title")}</Button>
          </Link>
        )}
        {consultation.actions?.can_view_record && consultation.has_medical_record && (
          <Link to={`/app/medical-records/${consultation.id}`}>
            <Button variant="secondary">{t("record.title")}</Button>
          </Link>
        )}
      </div>

      {consultation.actions?.can_add_internal_note && (
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("consultation.internalNotes")}
          </h2>

          {internalNotes && internalNotes.length > 0 && (
            <div className="space-y-2 mb-4">
              {internalNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                >
                  <p className="text-sm text-yellow-900">{note.content}</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {note.author_name} —{" "}
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder={t("consultation.addInternalNote")}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button
              onClick={() => noteMutation.mutate()}
              loading={noteMutation.isPending}
              disabled={!noteContent.trim()}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {/* ── Attachments ─────────────────────────────────────── */}
      {consultationId && (
        <ConsultationAttachmentsSection
          consultationId={consultationId}

        />
      )}
    </div>
  );
}

function ConsultationAttachmentsSection({ consultationId }: { consultationId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["attachments", consultationId],
    queryFn: () => attachmentsApi.list(consultationId),
  });

  const triggerDownload = async (id: string) => {
    try {
      const { blob, filename } = await attachmentsApi.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("attachment.error.not_available"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("attachment.deleteConfirm"))) return;
    try {
      await attachmentsApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["attachments", consultationId] });
    } catch {
      setError(t("attachment.error.permission"));
    }
  };

  const handleUpload = async (file: File, category: string, description: string, signal: AbortSignal) => {
    await attachmentsApi.upload(consultationId, file, category, description, undefined, signal);
    queryClient.invalidateQueries({ queryKey: ["attachments", consultationId] });
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("attachment.title")}</h2>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <AttachmentList
        attachments={data?.results || []}
        loading={isLoading}
        onUpload={handleUpload}
        onDownload={triggerDownload}
        onDelete={handleDelete}
        showUpload={true}
      />
    </div>
  );
}
