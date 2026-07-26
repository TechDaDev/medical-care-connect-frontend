import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { attachmentsAdminApi } from "../../api/attachmentsAdmin";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";
import { useI18n } from "../../i18n";
import type {
  AdminAttachmentDetail,
  AttachmentAdminAction,
} from "../../types/adminPhaseE";
import { getErrorMessage } from "../../utils/errors";

type MutableAction = Exclude<AttachmentAdminAction, "download">;

export function AttachmentAdminDetailPage() {
  const { attachmentId = "" } = useParams();
  const { t, formatDateTime, formatFileSize } = useI18n();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<MutableAction | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const query = useQuery({
    queryKey: ["admin-attachment", attachmentId],
    queryFn: () => attachmentsAdminApi.detail(attachmentId),
    enabled: Boolean(attachmentId),
  });

  const actionMutation = useMutation({
    mutationFn: async (selected: MutableAction) => {
      if (!query.data) throw new Error("Missing attachment");
      const payload = { reason, expected_status: query.data.status };
      if (selected === "rescan") return attachmentsAdminApi.rescan(attachmentId, payload);
      if (selected === "reject") return attachmentsAdminApi.reject(attachmentId, payload);
      if (selected === "release") return attachmentsAdminApi.release(attachmentId, payload);
      return attachmentsAdminApi.retentionDelete(attachmentId, payload);
    },
    onSuccess: async (detail) => {
      queryClient.setQueryData(["admin-attachment", attachmentId], detail);
      setAction(null);
      setReason("");
      setConfirmation("");
      setStatusMessage(t("attachmentAdmin.actionComplete"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-attachments"] }),
        queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-events"] }),
      ]);
    },
  });

  const download = async (detail: AdminAttachmentDetail) => {
    const result = await attachmentsAdminApi.download(detail.id, detail.filename);
    const url = URL.createObjectURL(result.blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  }
  const detail = query.data;
  const sections = [
    {
      title: t("attachmentAdmin.metadata"),
      rows: [
        [t("attachmentAdmin.file"), detail.filename],
        [t("attachmentAdmin.mimeType"), detail.mime_type],
        [t("attachmentAdmin.fileSize"), formatFileSize(detail.size_bytes)],
        [t("attachmentAdmin.extension"), detail.file_extension],
        [t("attachmentAdmin.checksum"), detail.checksum],
      ],
    },
    {
      title: t("attachmentAdmin.scanAndQuarantine"),
      rows: [
        [t("attachmentAdmin.status"), t(`attachmentAdmin.status.${detail.status}`)],
        [t("attachmentAdmin.scanResult"), t(`attachmentAdmin.scan.${detail.scanner_status}`)],
        [t("attachmentAdmin.provider"), detail.scanner_provider || "—"],
        [t("attachmentAdmin.scanCompleted"), detail.scan_completed_at ? formatDateTime(detail.scan_completed_at) : "—"],
        [t("attachmentAdmin.quarantineReason"), detail.quarantine_reason || "—"],
        [t("attachmentAdmin.rejectionReason"), detail.rejection_reason || "—"],
      ],
    },
    {
      title: t("attachmentAdmin.owner"),
      rows: [
        [t("attachmentAdmin.ownerType"), detail.owner_type],
        [t("attachmentAdmin.ownerReference"), detail.owner_reference],
      ],
    },
    {
      title: t("attachmentAdmin.retention"),
      rows: [[t("attachmentAdmin.retentionEligible"), detail.retention_eligible ? t("common.yes") : t("common.no")]],
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("attachmentAdmin.detailTitle")}
        subtitle={detail.id}
        actions={<Link to="/app/staff/attachments"><Button variant="outline">{t("common.back")}</Button></Link>}
      />
      {statusMessage && <p role="status" className="text-sm text-green-700">{statusMessage}</p>}
      {actionMutation.isError && <p role="alert" className="text-sm text-red-700">{getErrorMessage(actionMutation.error)}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={detail.status === "available" ? "success" : detail.status === "quarantined" || detail.status === "rejected" ? "danger" : "neutral"}>{t(`attachmentAdmin.status.${detail.status}`)}</Badge>
        {detail.available_actions.map((item) =>
          item === "download" ? (
            <Button key={item} variant="outline" onClick={() => download(detail)}>{t("common.download")}</Button>
          ) : (
            <Button
              key={item}
              variant={item === "reject" || item === "retention_delete" ? "danger" : "secondary"}
              onClick={() => {
                setAction(item);
                setStatusMessage("");
              }}
            >
              {t(`attachmentAdmin.action.${item}`)}
            </Button>
          ),
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">{section.title}</h2>
            <dl className="space-y-2 text-sm">
              {section.rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-3">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="break-all text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-3 font-semibold">{t("attachmentAdmin.history")}</h2>
        {!detail.action_history.length ? (
          <p className="text-sm text-slate-500">{t("attachmentAdmin.noHistory")}</p>
        ) : (
          <ol className="space-y-2">
            {detail.action_history.map((event) => (
              <li key={event.id} className="flex justify-between border-b pb-2 text-sm">
                <span>{event.event_type}</span>
                <time dateTime={event.created_at}>{formatDateTime(event.created_at)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Modal open={Boolean(action)} onClose={() => !actionMutation.isPending && setAction(null)} title={action ? t(`attachmentAdmin.action.${action}`) : ""}>
        {action && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              actionMutation.mutate(action);
            }}
          >
            <p className="text-sm text-slate-600">{t(`attachmentAdmin.actionHelp.${action}`)}</p>
            <Input required minLength={3} label={t("attachmentAdmin.reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
            {action === "retention_delete" && (
              <>
                <p role="alert" className="text-sm font-medium text-red-700">{t("attachmentAdmin.irreversible")}</p>
                <Input required label={t("attachmentAdmin.confirmDelete")} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAction(null)}>{t("common.cancel")}</Button>
              <Button
                type="submit"
                variant={action === "reject" || action === "retention_delete" ? "danger" : "primary"}
                loading={actionMutation.isPending}
                disabled={!reason.trim() || (action === "retention_delete" && confirmation !== "DELETE")}
              >
                {t("common.confirm")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
