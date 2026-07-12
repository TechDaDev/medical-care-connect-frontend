import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../../api/consultations";
import { messagesApi } from "../../api/messages";
import { notificationsApi } from "../../api/notifications";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { useAuth } from "../../auth";

export function PatientDashboard() {
  const { user } = useAuth();

  const { data: consultations } = useQuery({
    queryKey: ["patient-consultations"],
    queryFn: () => consultationsApi.list(),
  });

  const { data: unreadCounts } = useQuery({
    queryKey: ["unread-counts"],
    queryFn: messagesApi.allUnreadCounts,
  });

  const { data: notifCount } = useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: notificationsApi.unreadCount,
  });

  const activeCount =
    consultations?.results.filter((c) =>
      ["submitted", "accepted", "intake_in_progress", "doctor_review"].includes(c.status)
    ).length || 0;

  const awaitingAction =
    consultations?.results.filter((c) =>
      ["awaiting_patient_response", "follow_up_required"].includes(c.status)
    ).length || 0;

  const totalUnread =
    unreadCounts?.reduce((sum, c) => sum + c.unread_count, 0) || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {t("nav.dashboard")}
      </h1>
      <p className="text-gray-500 mb-6">
        {t("common.loading")}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">
            {t("consultation.title")}
          </p>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">
            {t("consultation.title")}
          </p>
          <p className="text-2xl font-bold text-yellow-600">
            {awaitingAction}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">
            {t("message.title")}
          </p>
          <p className="text-2xl font-bold text-blue-600">{totalUnread}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">
            {t("notification.title")}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {notifCount?.unread_count || 0}
          </p>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Link to="/doctors">
          <Button>{t("nav.findDoctor")}</Button>
        </Link>
        <Link to="/app/patient/consultations">
          <Button variant="secondary">
            {t("nav.consultations")}
          </Button>
        </Link>
      </div>

      {consultations && consultations.results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("consultation.title")}
          </h2>
          <div className="space-y-3">
            {consultations.results.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/app/patient/consultations/${c.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {c.doctor?.user.full_name || "Doctor"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {c.status}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
