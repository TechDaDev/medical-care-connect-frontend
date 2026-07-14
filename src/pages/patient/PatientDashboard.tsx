import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { accountsApi } from "../../api/auth";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { RefreshButton } from "../../components/common/RefreshButton";
import { ErrorState } from "../../components/common/ErrorState";
import { getErrorMessage } from "../../utils/errors";

export function PatientDashboard() {
  const { t } = useI18n();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: () => accountsApi.getPatientDashboard(),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  if (!data) return null;

  const { consultations, unread_messages, unread_notifications, recent_consultations } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("nav.dashboard")}
        </h1>
        <RefreshButton onClick={() => refetch()} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.active")}</p>
          <p className="text-2xl font-bold text-gray-900">{consultations.active}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.awaitingYou")}</p>
          <p className="text-2xl font-bold text-yellow-600">{consultations.awaiting_patient}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("message.unread")}</p>
          <p className="text-2xl font-bold text-blue-600">{unread_messages}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("notification.unread")}</p>
          <p className="text-2xl font-bold text-purple-600">{unread_notifications}</p>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Link to="/doctors">
          <Button>{t("nav.findDoctor")}</Button>
        </Link>
        <Link to="/app/patient/consultations">
          <Button variant="secondary">{t("nav.consultations")}</Button>
        </Link>
      </div>

      {recent_consultations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("consultation.recent")}
          </h2>
          <div className="space-y-3">
            {recent_consultations.map((c) => (
              <Link
                key={c.id}
                to={`/app/patient/consultations/${c.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {c.doctor_name || "Doctor"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {c.specialty_name} &middot; {c.status.replace(/_/g, " ")}
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
