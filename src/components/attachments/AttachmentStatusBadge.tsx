import { t } from "../../utils/i18n";
import { AttachmentStatus } from "../../types/attachments";

const STATUS_BADGE: Record<AttachmentStatus, { color: string; label: string }> = {
  [AttachmentStatus.PENDING]: { color: "bg-yellow-100 text-yellow-800", label: t("attachment.status_pending") },
  [AttachmentStatus.AVAILABLE]: { color: "bg-green-100 text-green-800", label: t("attachment.status_available") },
  [AttachmentStatus.QUARANTINED]: { color: "bg-red-100 text-red-800", label: t("attachment.status_quarantined") },
  [AttachmentStatus.REJECTED]: { color: "bg-red-100 text-red-800", label: t("attachment.status_rejected") },
  [AttachmentStatus.DELETED]: { color: "bg-gray-100 text-gray-800", label: t("attachment.status_deleted") },
};

export function AttachmentStatusBadge({ status }: { status: AttachmentStatus }) {
  const b = STATUS_BADGE[status] || STATUS_BADGE[AttachmentStatus.PENDING];
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${b.color}`}>
      {b.label}
    </span>
  );
}
