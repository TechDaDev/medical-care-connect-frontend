import { Attachment as AttachmentType, AttachmentStatus } from "../../types/attachments";
import { AttachmentCard } from "./AttachmentCard";
import { AttachmentUploadForm } from "./AttachmentUploadForm";
import { t } from "../../utils/i18n";

interface Props {
  attachments: AttachmentType[];
  loading: boolean;
  onUpload: (file: File, category: string, description: string, signal: AbortSignal) => Promise<void>;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  maxSizeMB?: number;
  allowedExtensions?: string;
  showUpload?: boolean;
}

export function AttachmentList({
  attachments,
  loading,
  onUpload,
  onDownload,
  onDelete,
  maxSizeMB = 10,
  allowedExtensions = "pdf,jpg,jpeg,png",
  showUpload = true,
}: Props) {
  const visible = attachments.filter((a) => a.status !== AttachmentStatus.DELETED);

  return (
    <div className="space-y-4">
      {showUpload && (
        <AttachmentUploadForm
          onUpload={onUpload}
          maxSizeMB={maxSizeMB}
          allowedExtensions={allowedExtensions}
        />
      )}

      {loading && <p className="text-sm text-gray-500">{t("common.loading")}</p>}

      {!loading && visible.length === 0 && (
        <p className="text-sm text-gray-500">{t("attachment.noAttachments")}</p>
      )}

      <div className="space-y-2">
        {visible.map((att) => (
          <AttachmentCard
            key={att.id}
            attachment={att}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
