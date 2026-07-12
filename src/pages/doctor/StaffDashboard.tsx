import { useQuery } from "@tanstack/react-query";
import { staffApi } from "../../api/staff";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { getErrorMessage } from "../../utils/errors";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/Button";

export function StaffDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: () => staffApi.dashboard(),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  if (!data) return null;

  const { consultations, doctors } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.dashboard")}</h1>
        <RefreshButton onClick={() => refetch()} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.total")}</p>
          <p className="text-2xl font-bold text-gray-900">{consultations.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.submitted")}</p>
          <p className="text-2xl font-bold text-blue-600">{consultations.submitted}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.emergency")}</p>
          <p className="text-2xl font-bold text-red-600">{consultations.emergency_escalated}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.urgent")}</p>
          <p className="text-2xl font-bold text-orange-600">{consultations.urgent}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.inProgress")}</p>
          <p className="text-lg font-semibold text-gray-900">{consultations.intake_in_progress}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.doctorReview")}</p>
          <p className="text-lg font-semibold text-gray-900">{consultations.doctor_review}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.cancelled")}</p>
          <p className="text-lg font-semibold text-gray-900">{consultations.cancelled}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("consultation.unassigned")}</p>
          <p className="text-lg font-semibold text-gray-900">{consultations.unassigned}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.approved")}</p>
          <p className="text-lg font-bold text-green-600">{doctors.approved}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.accepting")}</p>
          <p className="text-lg font-bold text-blue-600">{doctors.accepting}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.notAccepting")}</p>
          <p className="text-lg font-bold text-gray-600">{doctors.non_accepting}</p>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Link to="/app/staff/consultations">
          <Button>{t("nav.consultations")}</Button>
        </Link>
        <Link to="/app/staff/doctors">
          <Button variant="secondary">{t("nav.doctorWorkload")}</Button>
        </Link>
      </div>
    </div>
  );
}
