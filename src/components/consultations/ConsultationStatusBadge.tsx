import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Stethoscope,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "../../i18n";
import { ConsultationStatus } from "../../types";
import { clsx } from "../../utils/clsx";

interface StatusStyle {
  icon: LucideIcon;
  className: string;
}

const statusStyles: Record<ConsultationStatus, StatusStyle> = {
  [ConsultationStatus.DRAFT]: {
    icon: Circle,
    className: "bg-slate-100 text-slate-700",
  },
  [ConsultationStatus.SUBMITTED]: {
    icon: Clock3,
    className: "bg-blue-100 text-blue-800",
  },
  [ConsultationStatus.ACCEPTED]: {
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800",
  },
  [ConsultationStatus.INTAKE_IN_PROGRESS]: {
    icon: Clock3,
    className: "bg-amber-100 text-amber-800",
  },
  [ConsultationStatus.INTAKE_COMPLETED]: {
    icon: CheckCircle2,
    className: "bg-teal-100 text-teal-800",
  },
  [ConsultationStatus.DOCTOR_REVIEW]: {
    icon: Stethoscope,
    className: "bg-violet-100 text-violet-800",
  },
  [ConsultationStatus.AWAITING_PATIENT_RESPONSE]: {
    icon: Clock3,
    className: "bg-amber-100 text-amber-800",
  },
  [ConsultationStatus.AWAITING_DOCTOR_RESPONSE]: {
    icon: Clock3,
    className: "bg-blue-100 text-blue-800",
  },
  [ConsultationStatus.UNDER_REVIEW]: {
    icon: Stethoscope,
    className: "bg-violet-100 text-violet-800",
  },
  [ConsultationStatus.FOLLOW_UP_REQUIRED]: {
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-900",
  },
  [ConsultationStatus.PHYSICAL_VISIT_REQUIRED]: {
    icon: AlertTriangle,
    className: "bg-orange-100 text-orange-900",
  },
  [ConsultationStatus.TRANSFERRED]: {
    icon: ArrowRightLeft,
    className: "bg-slate-100 text-slate-700",
  },
  [ConsultationStatus.COMPLETED]: {
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800",
  },
  [ConsultationStatus.CANCELLED]: {
    icon: XCircle,
    className: "bg-slate-200 text-slate-700",
  },
  [ConsultationStatus.EMERGENCY_ESCALATED]: {
    icon: AlertTriangle,
    className: "bg-red-100 text-red-900",
  },
};

interface Props {
  status: ConsultationStatus;
  className?: string;
}

export function ConsultationStatusBadge({ status, className }: Props) {
  const { t } = useI18n();
  const style = statusStyles[status];
  const Icon = style.icon;
  const label = t(`consultation.status.${status}`);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        style.className,
        className,
      )}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
