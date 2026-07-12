import { t } from "../../utils/i18n";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
      <p className="text-gray-600 mb-4">
        {message || t("common.error")}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
