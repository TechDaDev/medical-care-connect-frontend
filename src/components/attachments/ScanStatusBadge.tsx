import { useI18n } from "../../i18n";
import { ScanStatus } from "../../types/attachments";

const SCAN_BADGE_COLORS: Record<ScanStatus, string> = {
  [ScanStatus.NOT_REQUIRED]: "bg-gray-100 text-gray-600",
  [ScanStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [ScanStatus.CLEAN]: "bg-green-100 text-green-800",
  [ScanStatus.SUSPICIOUS]: "bg-orange-100 text-orange-800",
  [ScanStatus.INFECTED]: "bg-red-100 text-red-800",
  [ScanStatus.FAILED]: "bg-red-100 text-red-800",
};

const SCAN_BADGE_KEYS: Record<ScanStatus, string> = {
  [ScanStatus.NOT_REQUIRED]: "attachment.scan_not_required",
  [ScanStatus.PENDING]: "attachment.scan_pending",
  [ScanStatus.CLEAN]: "attachment.scan_clean",
  [ScanStatus.SUSPICIOUS]: "attachment.scan_suspicious",
  [ScanStatus.INFECTED]: "attachment.scan_infected",
  [ScanStatus.FAILED]: "attachment.scan_failed",
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const { t } = useI18n();
  const color = SCAN_BADGE_COLORS[status] || SCAN_BADGE_COLORS[ScanStatus.NOT_REQUIRED];
  const label = t(SCAN_BADGE_KEYS[status] || "attachment.scan_not_required");
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}
