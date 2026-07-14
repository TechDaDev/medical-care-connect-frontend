import { useI18n } from "../../i18n";
import { Attachment } from "../../types/attachments";
import { attachmentCategoryLabel } from "./attachmentUtils";
import { AttachmentStatusBadge } from "./AttachmentStatusBadge";
import { ScanStatusBadge } from "./ScanStatusBadge";
import { formatDate, formatFileSize } from "../../utils/format";

interface Props {
  attachment: Attachment;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AttachmentCard({ attachment, onDownload, onDelete }: Props) {
  const { t } = useI18n();
  return (
    <div className="border rounded-lg p-3 bg-white space-y-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate" title={attachment.original_filename}>
            {attachment.safe_display_name || attachment.original_filename}
          </p>
          <p className="text-xs text-gray-500">
            {attachmentCategoryLabel(attachment.category, t)}
            {" · "}
            {formatFileSize(attachment.size_bytes)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <AttachmentStatusBadge status={attachment.status} />
          <ScanStatusBadge status={attachment.scan_status} />
        </div>
      </div>

      {attachment.description && (
        <p className="text-xs text-gray-600">{attachment.description}</p>
      )}

      <div className="text-xs text-gray-400 flex justify-between">
        <span>
          {attachment.uploader_name} · {formatDate(attachment.created_at)}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        {attachment.actions.can_download && onDownload && (
          <button
            onClick={() => onDownload(attachment.id)}
            className="text-xs text-blue-600 hover:underline"
          >
            {t("attachment.action.can_download")}
          </button>
        )}
        {attachment.actions.can_delete && onDelete && (
          <button
            onClick={() => onDelete(attachment.id)}
            className="text-xs text-red-600 hover:underline"
          >
            {t("attachment.action.can_delete")}
          </button>
        )}
      </div>
    </div>
  );
}
