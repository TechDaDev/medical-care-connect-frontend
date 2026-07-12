import { t } from "../../utils/i18n";

interface Props {
  message?: string;
}

export function EmptyState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
      <p className="text-gray-500">{message || t("common.loading")}</p>
    </div>
  );
}
