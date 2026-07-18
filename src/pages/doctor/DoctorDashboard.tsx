import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsApi } from "../../api/doctors";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { getErrorMessage } from "../../utils/errors";
import { Stethoscope, Clock, MessageSquare, Bell, CheckCircle, FileText, UserCheck } from "lucide-react";

const consultationStatCards = [
  { key: "total_active", label: "consultation.active", icon: Stethoscope, color: "text-primary-600", bg: "bg-primary-100" },
  { key: "submitted", label: "consultation.pending", icon: Clock, color: "text-status-warning-600", bg: "bg-status-warning-100" },
] as const;

const topStatCards = [
  { key: "unread_messages", label: "message.unread", icon: MessageSquare, color: "text-medical-teal-600", bg: "bg-medical-teal-100" },
  { key: "unread_notifications", label: "notification.unread", icon: Bell, color: "text-status-info-600", bg: "bg-status-info-100" },
] as const;

const detailCards = [
  { key: "accepted", label: "consultation.accepted", icon: CheckCircle, color: "text-status-success-600", bg: "bg-status-success-100" },
  { key: "intake_completed", label: "consultation.intakeCompleted", icon: FileText, color: "text-medical-teal-600", bg: "bg-medical-teal-100" },
  { key: "doctor_review", label: "consultation.doctorReview", icon: UserCheck, color: "text-primary-600", bg: "bg-primary-100" },
] as const;

export function DoctorDashboard() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["doctor-dashboard"],
    queryFn: () => doctorsApi.getDashboard(),
  });

  const toggleMut = useMutation({
    mutationFn: (accepting: boolean) => doctorsApi.toggleAccepting(accepting),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor-dashboard"] });
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  if (!data) return null;

  const { consultations, profile, ...topStats } = data;
  const canToggle = profile.is_approved;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("nav.dashboard")}</h1>
        <RefreshButton onClick={() => refetch()} />
      </div>

      {!profile.is_approved && (
        <div className="mb-6 p-4 bg-status-warning-50 border border-status-warning-200 rounded-lg flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-status-warning-100 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-status-warning-600" />
          </div>
          <p className="text-status-warning-800 text-sm font-medium mt-0.5">{t("doctor.notApproved")}</p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-slate-600">{t("doctor.acceptingStatus")}:</span>
        <Button
          variant={profile.is_accepting_consultations ? "primary" : "outline"}
          size="sm"
          disabled={!canToggle || toggleMut.isPending}
          onClick={() => toggleMut.mutate(!profile.is_accepting_consultations)}
        >
          {profile.is_accepting_consultations ? t("doctor.accepting") : t("doctor.notAccepting")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {consultationStatCards.map((stat) => (
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
        {topStatCards.map((stat) => (
          <Card key={stat.key} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t(stat.label)}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {topStats[stat.key] ?? 0}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {detailCards.map((card) => (
          <Card key={card.key} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{t(card.label)}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {consultations[card.key as keyof typeof consultations]}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}