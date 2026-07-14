import { RefreshCw } from "lucide-react";
import { useI18n } from "../../i18n";

interface Props {
  onClick: () => void;
  loading?: boolean;
}

export function RefreshButton({ onClick, loading }: Props) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
      title={t("common.refresh")}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {t("common.refresh")}
    </button>
  );
}
