import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsApi } from "../../api/doctors";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { getErrorMessage } from "../../utils/errors";

export function DoctorDashboard() {
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

  const { consultations, unread_messages, unread_notifications, profile } = data;
  const canToggle = profile.is_approved;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.dashboard")}</h1>
        <RefreshButton onClick={() => refetch()} />
      </div>

      {!profile.is_approved && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">{t("doctor.notApproved")}</p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-gray-600">{t("doctor.acceptingStatus")}:</span>
        <Button
          variant={profile.is_accepting_consultations ? "primary" : "secondary"}
          size="sm"
          disabled={!canToggle || toggleMut.isPending}
          onClick={() => toggleMut.mutate(!profile.is_accepting_consultations)}
        >
          {profile.is_accepting_consultations ? t("doctor.accepting") : t("doctor.notAccepting")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.active")}</p>
          <p className="text-2xl font-bold text-gray-900">{consultations.total_active}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.pending")}</p>
          <p className="text-2xl font-bold text-blue-600">{consultations.submitted}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("message.unread")}</p>
          <p className="text-2xl font-bold text-purple-600">{unread_messages}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("notification.unread")}</p>
          <p className="text-2xl font-bold text-purple-600">{unread_notifications}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-xs text-gray-500">{t("consultation.accepted")}</p>
          <p className="text-lg font-bold text-gray-900">{consultations.accepted}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">{t("consultation.intakeCompleted")}</p>
          <p className="text-lg font-bold text-gray-900">{consultations.intake_completed}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">{t("consultation.doctorReview")}</p>
          <p className="text-lg font-bold text-gray-900">{consultations.doctor_review}</p>
        </Card>
      </div>
    </div>
  );
}
