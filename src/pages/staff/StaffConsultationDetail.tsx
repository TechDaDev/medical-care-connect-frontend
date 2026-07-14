import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { consultationsApi } from "../../api/consultations";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { TransferModal } from "./TransferModal";
import { PriorityControl } from "./PriorityControl";
import { getErrorMessage } from "../../utils/errors";
import { Link } from "react-router-dom";
import { AttachmentList } from "../../components/attachments/AttachmentList";
import { attachmentsApi } from "../../api/attachments";
import { useQueryClient } from "@tanstack/react-query";

export function StaffConsultationDetail() {
  const { t } = useI18n();
  const { consultationId } = useParams<{ consultationId: string }>();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showPriority, setShowPriority] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-consultation-detail", consultationId],
    queryFn: () => consultationsApi.getById(consultationId!),
    enabled: !!consultationId,
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  if (!data) return null;

  const actions = data.actions;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/app/staff/consultations"
            className="text-sm text-blue-600 hover:underline mb-1 inline-block"
          >
            &larr; {t("nav.staffConsultations")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("staff.consultationDetail")}
          </h1>
        </div>
        <div className="flex gap-2">
          {actions?.can_transfer && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowTransfer(true)}
            >
              {t("consultation.transfer")}
            </Button>
          )}
          {actions?.can_change_priority && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPriority(true)}
            >
              {t("consultation.changePriority")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold mb-4">{t("consultation.detail")}</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t("consultation.status")}</dt>
                <dd>
                  <Badge variant="info">{data.status.replace(/_/g, " ")}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t("consultation.priority")}</dt>
                <dd>
                  <Badge
                    variant={
                      data.priority === "emergency"
                        ? "danger"
                        : data.priority === "urgent"
                        ? "warning"
                        : "info"
                    }
                  >
                    {data.priority}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t("consultation.patient")}</dt>
                <dd className="text-sm font-medium">
                  {data.patient?.user?.full_name || "N/A"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t("consultation.doctor")}</dt>
                <dd className="text-sm font-medium">
                  {data.doctor?.user?.full_name || t("consultation.unassigned")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t("consultation.specialty")}</dt>
                <dd className="text-sm font-medium">
                  {data.specialty?.name || "N/A"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t("consultation.created")}</dt>
                <dd className="text-sm">
                  {new Date(data.created_at).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t("consultation.updated")}</dt>
                <dd className="text-sm">
                  {new Date(data.updated_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </Card>

          {data.description && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                {t("consultation.chiefComplaint")}
              </h3>
              <p className="text-gray-900">{data.description}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-medium text-gray-900 mb-3">
              {t("consultation.noActions")}
            </h3>
            <div className="space-y-2">
              {actions?.can_message && (
                <Link to={`/app/patient/messages/${data.id}`}>
                  <Button variant="secondary" className="w-full" size="sm">
                    {t("actions.canMessage")}
                  </Button>
                </Link>
              )}
              {actions?.can_view_record && data.has_medical_record && (
                <Link to={`/app/medical-records/${data.id}`}>
                  <Button variant="secondary" className="w-full" size="sm">
                    {t("actions.canViewRecord")}
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {data.has_intake_session !== undefined && (
            <Card>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("consultation.intakeCompleted")}</span>
                <span>{data.has_intake_session ? t("common.yes") : t("common.no")}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">{t("record.title")}</span>
                <span>{data.has_medical_record ? t("common.yes") : t("common.no")}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Attachments ─────────────────────────────────────── */}
      {consultationId && (
        <StaffAttachmentsSection
          consultationId={consultationId}
        />
      )}

      {showTransfer && consultationId && (
        <TransferModal
          consultationId={consultationId}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            setShowTransfer(false);
            refetch();
          }}
        />
      )}

      {showPriority && consultationId && (
        <PriorityControl
          consultationId={consultationId}
          currentPriority={data.priority}
          onClose={() => setShowPriority(false)}
          onSuccess={() => {
            setShowPriority(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function StaffAttachmentsSection({ consultationId }: { consultationId: string }) {
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
    const reason = prompt(t("attachment.staffDeleteReason"));
    if (!reason || !reason.trim()) return;
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
