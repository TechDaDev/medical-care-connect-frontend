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
import { Stethoscope, Clock, MessageSquare, Bell, Plus, List } from "lucide-react";

const statCards = [
  { key: "active", label: "consultation.active", icon: Stethoscope, color: "text-primary-600", bg: "bg-primary-100" },
  { key: "awaiting_patient", label: "consultation.awaitingYou", icon: Clock, color: "text-status-warning-600", bg: "bg-status-warning-100" },
  { key: "unread_messages", label: "message.unread", icon: MessageSquare, color: "text-medical-teal-600", bg: "bg-medical-teal-100" },
  { key: "unread_notifications", label: "notification.unread", icon: Bell, color: "text-status-info-600", bg: "bg-status-info-100" },
] as const;

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
        <h1 className="text-2xl font-bold text-slate-900">
          {t("nav.dashboard")}
        </h1>
        <RefreshButton onClick={() => refetch()} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.key} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t(stat.label)}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {consultations[stat.key as keyof typeof consultations]}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        <Link to="/app/patient/doctors">
          <Button className="gap-2">
            <Plus className="h-5 w-5" />
            {t("nav.findDoctor")}
          </Button>
        </Link>
        <Link to="/app/patient/consultations">
          <Button variant="outline" className="gap-2">
            <List className="h-5 w-5" />
            {t("nav.consultations")}
          </Button>
        </Link>
      </div>

      {recent_consultations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t("consultation.recent")}
          </h2>
          <div className="space-y-3">
            {recent_consultations.map((c) => (
              <Link
                key={c.id}
                to={`/app/patient/consultations/${c.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">
                        {c.doctor_name || "Doctor"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {c.specialty_name} &middot; {c.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <p className="text-sm text-slate-400">
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