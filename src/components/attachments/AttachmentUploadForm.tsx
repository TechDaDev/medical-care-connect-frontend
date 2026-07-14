import { useCallback, useRef, useState } from "react";
import { useI18n } from "../../i18n";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { UploadProgress } from "./UploadProgress";
import { getAttachmentCategories } from "./attachmentUtils";

interface Props {
  onUpload: (file: File, category: string, description: string, signal: AbortSignal) => Promise<void>;
  maxSizeMB: number;
  allowedExtensions: string;
  disabled?: boolean;
}

export function AttachmentUploadForm({ onUpload, maxSizeMB, allowedExtensions, disabled }: Props) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const categories = getAttachmentCategories(t);
  const [category, setCategory] = useState<string>(categories[0]?.value || "");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(t("attachment.error.too_large"));
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await onUpload(file, category, description, controller.signal);
      setFile(null);
      setProgress(100);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "CanceledError") {
        setError(t("attachment.cancelled"));
      } else {
        setError(t("attachment.uploadFailed"));
      }
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  }, [file, category, description, onUpload, t]);

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-white">
      <h3 className="font-medium text-sm">{t("attachment.upload_new")}</h3>

      <p className="text-xs text-gray-500">
        {t("attachment.maxSize", { size: String(maxSizeMB) })}
        <br />
        {t("attachment.allowedTypes", { types: allowedExtensions })}
      </p>

      <Input
        type="file"
        label={t("attachment.selectFile")}
        onChange={handleFileChange}
        disabled={uploading || disabled}
        accept={`.${allowedExtensions.replace(/,/g, ",.")}`}
      />

      {file && (
        <div className="text-sm text-gray-700">
          {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </div>
      )}

      <Select
        label={t("attachment.category")}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={categories.map((c) => ({ value: c.value, label: c.label }))}
        disabled={uploading || disabled}
      />

      <Input
        label={t("attachment.description")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("attachment.description")}
        disabled={uploading || disabled}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {uploading && <UploadProgress percent={progress} onCancel={handleCancel} />}

      <div className="flex gap-2">
        <Button onClick={handleUpload} disabled={!file || uploading || disabled}>
          {uploading ? t("common.uploading") : t("common.upload")}
        </Button>
      </div>
    </div>
  );
}
