import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  List,
  LockKeyhole,
  MessageSquare,
  Plus,
  Stethoscope,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { accountsApi } from "../../api/auth";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { Skeleton } from "../../components/common/Skeleton";
import { ConsultationStatusBadge } from "../../components/consultations/ConsultationStatusBadge";
import { useI18n } from "../../i18n";
import type {
  PatientAttentionItem,
  PatientDashboardConsultations,
} from "../../types";
import { clsx } from "../../utils/clsx";
import { getErrorMessage } from "../../utils/errors";

const consultationSummary: Array<{
  key: keyof PatientDashboardConsultations;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "total", label: "patientDashboard.summary.total", icon: List },
  { key: "active", label: "patientDashboard.summary.active", icon: Stethoscope },
  {
    key: "awaiting_patient",
    label: "patientDashboard.summary.awaitingPatient",
    icon: Clock3,
  },
  {
    key: "awaiting_doctor",
    label: "patientDashboard.summary.awaitingDoctor",
    icon: Clock3,
  },
  {
    key: "intake_in_progress",
    label: "patientDashboard.summary.intakeInProgress",
    icon: Clock3,
  },
  {
    key: "doctor_review",
    label: "patientDashboard.summary.doctorReview",
    icon: Stethoscope,
  },
  {
    key: "follow_up_required",
    label: "patientDashboard.summary.followUp",
    icon: AlertTriangle,
  },
  {
    key: "physical_visit_required",
    label: "patientDashboard.summary.physicalVisit",
    icon: AlertTriangle,
  },
  {
    key: "emergency_escalated",
    label: "patientDashboard.summary.emergency",
    icon: AlertTriangle,
  },
  {
    key: "completed",
    label: "patientDashboard.summary.completed",
    icon: CheckCircle2,
  },
  {
    key: "cancelled",
    label: "patientDashboard.summary.cancelled",
    icon: List,
  },
];

const severityClasses: Record<PatientAttentionItem["severity"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-red-200 bg-red-50 text-red-950",
};

function SectionHeading({
  id,
  children,
  count,
}: {
  id: string;
  children: string;
  count?: number;
}) {
  const { formatNumber } = useI18n();
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-semibold text-slate-900">
        {children}
      </h2>
      {count !== undefined && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {formatNumber(count)}
        </span>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label={t("patientDashboard.loading")}
    >
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} aria-hidden="true">
            <Skeleton className="mb-3 h-4 w-28" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function PatientDashboard() {
  const { t, formatDateTime, formatNumber } = useI18n();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: () => accountsApi.getPatientDashboard(),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div role="alert">
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }
  if (!data) {
    return (
      <div role="status" className="py-12 text-center text-slate-600">
        {t("patientDashboard.noData")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("patientDashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500" role="status">
            {t("patientDashboard.lastUpdated", {
              date: formatDateTime(data.generated_at),
            })}
          </p>
        </div>
        <RefreshButton
          onClick={() => void refetch()}
          loading={isFetching}
        />
      </header>

      <section aria-labelledby="patient-attention-heading">
        <SectionHeading
          id="patient-attention-heading"
          count={data.attention.total}
        >
          {t("patientDashboard.attention.title")}
        </SectionHeading>
        {data.attention.items.length === 0 ? (
          <Card className="text-sm text-slate-600" role="status">
            {t("patientDashboard.attention.empty")}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.attention.items.map((item) => {
              const content = (
                <div
                  className={clsx(
                    "h-full rounded-xl border p-4 transition-shadow",
                    severityClasses[item.severity],
                    item.action_path &&
                      "hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{t(item.title_key)}</h3>
                      <p className="mt-1 text-sm">{t(item.description_key)}</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-bold">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold">
                    {t(`patientDashboard.severity.${item.severity}`)}
                  </p>
                </div>
              );
              return item.action_path ? (
                <Link
                  key={`${item.type}-${item.consultation_id}`}
                  to={item.action_path}
                  className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  aria-label={t("patientDashboard.attention.open", {
                    item: t(item.title_key),
                  })}
                >
                  {content}
                </Link>
              ) : (
                <div key={`${item.type}-${item.consultation_id}`}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="consultation-summary-heading">
        <SectionHeading id="consultation-summary-heading">
          {t("patientDashboard.summary.title")}
        </SectionHeading>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {consultationSummary.map(({ key, label, icon: Icon }) => (
            <Card key={key} className="min-w-0">
              <Icon
                className="mb-3 h-5 w-5 text-primary-600"
                aria-hidden="true"
              />
              <p className="text-sm text-slate-600">{t(label)}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatNumber(data.consultations[key])}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section aria-labelledby="patient-messages-heading">
          <Card className="h-full">
            <SectionHeading
              id="patient-messages-heading"
              count={data.messages.unread_total}
            >
              {t("patientDashboard.messages.title")}
            </SectionHeading>
            {data.messages.recent_threads.length === 0 ? (
              <p className="text-sm text-slate-600" role="status">
                {t("patientDashboard.messages.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.messages.recent_threads.map((thread) => (
                  <li key={thread.consultation_id}>
                    <Link
                      to={`/app/patient/messages/${thread.consultation_id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-1 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      aria-label={t("patientDashboard.messages.open", {
                        doctor:
                          thread.doctor_name ||
                          t("patientDashboard.doctorUnavailable"),
                      })}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {thread.doctor_name ||
                            t("patientDashboard.doctorUnavailable")}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {thread.specialty_name ||
                            t("patientDashboard.specialtyUnavailable")}
                        </p>
                        {thread.last_message_at && (
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(thread.last_message_at)}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-medical-teal-100 px-2.5 py-1 text-xs font-semibold text-medical-teal-800">
                        <MessageSquare
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {formatNumber(thread.unread_count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section aria-labelledby="patient-notifications-heading">
          <Card className="h-full">
            <SectionHeading
              id="patient-notifications-heading"
              count={data.notifications.unread_total}
            >
              {t("patientDashboard.notifications.title")}
            </SectionHeading>
            {data.notifications.recent.length === 0 ? (
              <p className="text-sm text-slate-600" role="status">
                {t("patientDashboard.notifications.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.notifications.recent.map((notification) => (
                  <li key={notification.id}>
                    <Link
                      to="/app/patient/notifications"
                      className="block rounded-lg px-1 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      aria-label={t("patientDashboard.notifications.open", {
                        title: notification.title,
                      })}
                    >
                      <div className="flex items-start gap-3">
                        <Bell
                          className={clsx(
                            "mt-0.5 h-4 w-4 shrink-0",
                            notification.is_read
                              ? "text-slate-400"
                              : "text-primary-600",
                          )}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {notification.body}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <section aria-labelledby="recent-consultations-heading">
        <SectionHeading id="recent-consultations-heading">
          {t("patientDashboard.recentConsultations.title")}
        </SectionHeading>
        {data.recent_consultations.length === 0 ? (
          <Card className="text-sm text-slate-600" role="status">
            {t("patientDashboard.recentConsultations.empty")}
          </Card>
        ) : (
          <div className="space-y-3">
            {data.recent_consultations.map((consultation) => (
              <Link
                key={consultation.id}
                to={
                  consultation.medical_record_id
                    ? `/app/patient/medical-records/${consultation.medical_record_id}`
                    : `/app/patient/consultations/${consultation.id}`
                }
                className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label={t("patientDashboard.recentConsultations.open", {
                  doctor:
                    consultation.doctor_name ||
                    t("patientDashboard.doctorUnavailable"),
                })}
              >
                <Card
                  hover
                  className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {consultation.doctor_name ||
                        t("patientDashboard.doctorUnavailable")}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {consultation.specialty_name ||
                        t("patientDashboard.specialtyUnavailable")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(consultation.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {consultation.needs_patient_action && (
                      <span className="text-xs font-semibold text-amber-800">
                        {t("patientDashboard.recentConsultations.actionNeeded")}
                      </span>
                    )}
                    {consultation.has_medical_record && (
                      <span className="text-xs font-semibold text-teal-800">
                        {t(
                          "patientDashboard.recentConsultations.recordAvailable",
                        )}
                      </span>
                    )}
                    {consultation.unread_messages > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {t(
                          "patientDashboard.recentConsultations.unreadMessages",
                          { count: formatNumber(consultation.unread_messages) },
                        )}
                      </span>
                    )}
                    <ConsultationStatusBadge status={consultation.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="patient-profile-heading">
        <Card>
          <SectionHeading id="patient-profile-heading">
            {t("patientDashboard.profile.title")}
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">
                  {t("patientDashboard.profile.completion")}
                </span>
                <span className="font-bold text-slate-900">
                  {formatNumber(data.profile.completion_percent)}%
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-label={t("patientDashboard.profile.completion")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={data.profile.completion_percent}
              >
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: `${data.profile.completion_percent}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span
                  className={
                    data.profile.emergency_contact_complete
                      ? "text-emerald-700"
                      : "text-amber-800"
                  }
                >
                  {data.profile.emergency_contact_complete
                    ? t("patientDashboard.profile.emergencyComplete")
                    : t("patientDashboard.profile.emergencyIncomplete")}
                </span>
                <span
                  className={
                    data.profile.basic_health_complete
                      ? "text-emerald-700"
                      : "text-amber-800"
                  }
                >
                  {data.profile.basic_health_complete
                    ? t("patientDashboard.profile.healthComplete")
                    : t("patientDashboard.profile.healthIncomplete")}
                </span>
              </div>
            </div>
            <Link
              to="/app/patient/profile"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="ms-2">
                {t("patientDashboard.profile.complete")}
              </span>
            </Link>
          </div>
        </Card>
      </section>

      <section aria-labelledby="patient-quick-actions-heading">
        <SectionHeading id="patient-quick-actions-heading">
          {t("patientDashboard.quickActions.title")}
        </SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              path: "/app/patient/doctors",
              label: "patientDashboard.quickActions.findDoctor",
              icon: Plus,
            },
            {
              path: "/app/patient/consultations",
              label: "patientDashboard.quickActions.consultations",
              icon: List,
            },
            {
              path: "/app/patient/profile",
              label: "patientDashboard.quickActions.profile",
              icon: UserRound,
            },
            {
              path: "/app/patient/privacy",
              label: "patientDashboard.quickActions.privacy",
              icon: LockKeyhole,
            },
          ].map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 font-medium text-slate-800 shadow-sm hover:border-primary-300 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {t(label)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
