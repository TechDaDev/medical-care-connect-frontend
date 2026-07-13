import { t } from "../../utils/i18n";
import { ScanStatus } from "../../types/attachments";

const BADGE: Record<ScanStatus, { color: string; label: string }> = {
  [ScanStatus.NOT_REQUIRED]: { color: "bg-gray-100 text-gray-600", label: t("attachment.scan_not_required") },
  [ScanStatus.PENDING]: { color: "bg-yellow-100 text-yellow-800", label: t("attachment.scan_pending") },
  [ScanStatus.CLEAN]: { color: "bg-green-100 text-green-800", label: t("attachment.scan_clean") },
  [ScanStatus.SUSPICIOUS]: { color: "bg-orange-100 text-orange-800", label: t("attachment.scan_suspicious") },
  [ScanStatus.INFECTED]: { color: "bg-red-100 text-red-800", label: t("attachment.scan_infected") },
  [ScanStatus.FAILED]: { color: "bg-red-100 text-red-800", label: t("attachment.scan_failed") },
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const b = BADGE[status] || BADGE[ScanStatus.NOT_REQUIRED];
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${b.color}`}>
      {b.label}
    </span>
  );
}
