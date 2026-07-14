import { useI18n } from "../../i18n";

interface Props {
  percent: number;
  onCancel: () => void;
}

export function UploadProgress({ percent, onCancel }: Props) {
  const { t } = useI18n();
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{t("attachment.uploadProgress", { percent: String(percent) })}</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-red-500 hover:underline"
        >
          {t("common.cancel")}
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
