import { useI18n } from "../../i18n";
import { AttachmentStatus } from "../../types/attachments";

const STATUS_BADGE_COLORS: Record<AttachmentStatus, string> = {
  [AttachmentStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [AttachmentStatus.AVAILABLE]: "bg-green-100 text-green-800",
  [AttachmentStatus.QUARANTINED]: "bg-red-100 text-red-800",
  [AttachmentStatus.REJECTED]: "bg-red-100 text-red-800",
  [AttachmentStatus.DELETED]: "bg-gray-100 text-gray-800",
};

const STATUS_BADGE_KEYS: Record<AttachmentStatus, string> = {
  [AttachmentStatus.PENDING]: "attachment.status_pending",
  [AttachmentStatus.AVAILABLE]: "attachment.status_available",
  [AttachmentStatus.QUARANTINED]: "attachment.status_quarantined",
  [AttachmentStatus.REJECTED]: "attachment.status_rejected",
  [AttachmentStatus.DELETED]: "attachment.status_deleted",
};

export function AttachmentStatusBadge({ status }: { status: AttachmentStatus }) {
  const { t } = useI18n();
  const color = STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS[AttachmentStatus.PENDING];
  const label = t(STATUS_BADGE_KEYS[status] || "attachment.status_pending");
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}
