import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Star,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { doctorsApi } from "../../api/doctors";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Spinner } from "../../components/common/Spinner";
import { useI18n } from "../../i18n";
import { getErrorMessage } from "../../utils/errors";

const countCards = [
  ["total_active", "doctor.dashboard.active", Stethoscope],
  ["submitted", "doctor.dashboard.new", ClipboardList],
  ["awaiting_doctor", "doctor.dashboard.awaitingDoctor", AlertTriangle],
  ["completed", "doctor.dashboard.completed", CheckCircle],
] as const;

export function DoctorDashboard() {
  const { t, formatDateTime, formatNumber } = useI18n();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["doctor-dashboard"],
    queryFn: doctorsApi.getDashboard,
  });
  const toggleMutation = useMutation({
    mutationFn: (accepting: boolean) =>
      doctorsApi.toggleAccepting(accepting, query.data?.access.updated_at ?? undefined),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctor-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-availability"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-access-state"] }),
      ]);
    },
  });

  if (query.isLoading) {
    return <div role="status" aria-label={t("common.loading")}><Spinner /></div>;
  }
  if (query.error) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  }
  if (!query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const data = query.data;
  return (
    <main>
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("doctor.dashboard.welcome", { name: data.profile.full_name })}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {data.profile.professional_title}
            {data.profile.specialty_name ? ` · ${data.profile.specialty_name}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => query.refetch()} loading={query.isFetching}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t("common.refresh")}
        </Button>
      </header>

      {toggleMutation.error && (
        <div role="alert" className="mb-4 rounded-lg border border-status-error-200 bg-status-error-50 p-3 text-sm text-status-error-700">
          {getErrorMessage(toggleMutation.error)}
        </div>
      )}

      <section aria-label={t("doctor.dashboard.summary")} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {countCards.map(([key, label, Icon]) => (
          <Card key={key} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{t(label)}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatNumber(data.consultations[key])}
                </p>
              </div>
              <Icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
            </div>
          </Card>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">{t("doctor.acceptingStatus")}</h2>
              <p className="text-sm text-slate-600">
                {data.availability.active_slot_count
                  ? t("doctor.dashboard.activeSlots", { count: data.availability.active_slot_count })
                  : t("doctor.availability.empty")}
              </p>
            </div>
            <label className="inline-flex items-center gap-2">
              <span className="sr-only">{t("doctor.availability.acceptingControl")}</span>
              <input
                type="checkbox"
                role="switch"
                aria-label={t("doctor.availability.acceptingControl")}
                checked={data.availability.is_accepting_consultations}
                disabled={!data.availability.can_toggle_accepting || toggleMutation.isPending}
                onChange={(event) => toggleMutation.mutate(event.target.checked)}
                className="h-5 w-10 accent-primary-600"
              />
              <span className="text-sm text-slate-700">
                {data.availability.is_accepting_consultations
                  ? t("doctor.accepting")
                  : t("doctor.notAccepting")}
              </span>
            </label>
          </div>
          <Link className="mt-4 inline-flex text-sm font-medium text-primary-700 hover:underline" to="/app/doctor/availability">
            <CalendarClock className="h-4 w-4 me-2" aria-hidden="true" />
            {t("doctor.availability.manage")}
          </Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">{t("doctor.dashboard.profileCompletion")}</h2>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatNumber(data.profile.completion_percent)}%
              </p>
            </div>
            <UserRound className="h-6 w-6 text-primary-600" aria-hidden="true" />
          </div>
          {data.profile.missing_fields.length > 0 && (
            <p className="mt-2 text-sm text-slate-600">
              {t("doctor.dashboard.missingFields", { count: data.profile.missing_fields.length })}
            </p>
          )}
          <Link className="mt-3 inline-flex text-sm font-medium text-primary-700 hover:underline" to="/app/doctor/profile">
            {t("nav.profile")}
          </Link>
        </Card>
      </section>

      <section className="grid xl:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{t("doctor.dashboard.attention")}</h2>
            <span className="rounded-full bg-status-warning-100 px-2 py-1 text-xs font-semibold text-status-warning-800">
              {formatNumber(data.attention.total)}
            </span>
          </div>
          {data.attention.items.length === 0 ? (
            <p className="text-sm text-slate-600">{t("doctor.dashboard.attentionEmpty")}</p>
          ) : (
            <ul className="space-y-3">
              {data.attention.items.map((item) => (
                <li key={item.type} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{t(item.title_key)}</p>
                      <p className="text-sm text-slate-600">{t(item.description_key, { count: item.count })}</p>
                    </div>
                    <span className={`text-xs font-semibold ${item.severity === "danger" ? "text-status-error-700" : item.severity === "warning" ? "text-status-warning-700" : "text-status-info-700"}`}>
                      {formatNumber(item.count)}
                    </span>
                  </div>
                  {item.action_path && (
                    <Link className="mt-2 inline-flex text-sm text-primary-700 hover:underline" to={item.action_path}>
                      {t("doctor.dashboard.openTask")}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("doctor.dashboard.recentConsultations")}</h2>
          {data.recent_consultations.length === 0 ? (
            <p className="text-sm text-slate-600">{t("doctor.dashboard.noConsultations")}</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {data.recent_consultations.map((consultation) => (
                <li key={consultation.id} className="py-3 first:pt-0">
                  <Link className="block rounded focus:outline-none focus:ring-2 focus:ring-primary-500" to={consultation.action_path}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{consultation.patient_display_name}</p>
                        <p className="text-sm text-slate-600">{t(`consultation.status.${consultation.status}`)}</p>
                      </div>
                      {consultation.needs_doctor_action && (
                        <span className="rounded bg-status-warning-100 px-2 py-1 text-xs text-status-warning-800">
                          {t("doctor.dashboard.actionRequired")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(consultation.updated_at)}
                      {consultation.unread_messages > 0
                        ? ` · ${t("doctor.dashboard.unreadCount", { count: consultation.unread_messages })}`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid md:grid-cols-3 gap-6 mb-6">
        <SummaryList
          title={t("doctor.dashboard.messages")}
          icon={<MessageSquare className="h-5 w-5 text-primary-600" aria-hidden="true" />}
          total={data.messages.unread_total}
          empty={t("doctor.dashboard.noMessages")}
          items={data.messages.recent_threads.map((thread) => ({
            id: thread.consultation_id,
            title: thread.patient_display_name,
            detail: t("doctor.dashboard.unreadCount", { count: thread.unread_count }),
            date: thread.last_message_at ? formatDateTime(thread.last_message_at) : "",
            path: thread.action_path,
          }))}
        />
        <SummaryList
          title={t("doctor.dashboard.notifications")}
          icon={<Bell className="h-5 w-5 text-primary-600" aria-hidden="true" />}
          total={data.notifications.unread_total}
          empty={t("doctor.dashboard.noNotifications")}
          items={data.notifications.recent.map((notification) => ({
            id: notification.id,
            title: notification.title,
            detail: notification.body,
            date: formatDateTime(notification.created_at),
            path: notification.action_path,
          }))}
        />
        <SummaryList
          title={t("doctor.dashboard.reviews")}
          icon={<Star className="h-5 w-5 text-primary-600" aria-hidden="true" />}
          total={data.reviews.awaiting_response}
          empty={t("doctor.dashboard.noReviews")}
          items={data.reviews.recent.map((review) => ({
            id: review.id,
            title: t("doctor.dashboard.rating", { rating: review.rating }),
            detail: review.has_response ? t("doctor.dashboard.responded") : t("doctor.dashboard.needsResponse"),
            date: formatDateTime(review.created_at),
            path: review.action_path,
          }))}
        />
      </section>

      <p className="text-xs text-slate-500">
        {t("doctor.dashboard.generated", { date: formatDateTime(data.generated_at) })}
      </p>
    </main>
  );
}

function SummaryList({
  title,
  icon,
  total,
  empty,
  items,
}: {
  title: string;
  icon: ReactNode;
  total: number;
  empty: string;
  items: Array<{ id: string; title: string; detail: string; date: string; path: string | null }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">{icon}<h2 className="font-semibold text-slate-900">{title}</h2></div>
        <span className="text-sm font-semibold text-slate-700">{total}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              {item.path ? (
                <Link to={item.path} className="block rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <SummaryContent item={item} />
                </Link>
              ) : (
                <SummaryContent item={item} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SummaryContent({ item }: { item: { title: string; detail: string; date: string } }) {
  return (
    <>
      <p className="text-sm font-medium text-slate-900">{item.title}</p>
      <p className="text-xs text-slate-600 line-clamp-2">{item.detail}</p>
      {item.date && <p className="text-xs text-slate-500 mt-1">{item.date}</p>}
    </>
  );
}
