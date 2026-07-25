import { useQuery } from "@tanstack/react-query";
import { staffApi } from "../../api/staff";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { getErrorMessage } from "../../utils/errors";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../auth";
import { UserRole } from "../../types";

export function StaffDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: () => staffApi.dashboard(),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  if (!data) return null;

  const { consultations, doctors, users, queues, operations, messages } = data;
  const isAdmin = user?.role === UserRole.ADMINISTRATOR;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.dashboard")}</h1>
        <RefreshButton onClick={() => refetch()} />
      </div>

      {/* ── Consultation counters ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{t("consultation.title")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* ── Doctor counters ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{t("nav.doctorWorkload")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.total")}</p>
          <p className="text-lg font-bold text-gray-900">{doctors.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.pending")}</p>
          <p className="text-lg font-bold text-yellow-600">{doctors.pending}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.approved")}</p>
          <p className="text-lg font-bold text-green-600">{doctors.approved}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.rejected")}</p>
          <p className="text-lg font-bold text-red-600">{doctors.rejected}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("doctor.suspended")}</p>
          <p className="text-lg font-bold text-gray-600">{doctors.suspended}</p>
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

      {/* ── User counters ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{t("dashboard.users")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500">{t("dashboard.usersTotal")}</p>
          <p className="text-xl font-bold text-gray-900">{users.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("role.patient")}</p>
          <p className="text-xl font-bold text-blue-600">{users.patient}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("role.doctor")}</p>
          <p className="text-xl font-bold text-blue-600">{users.doctor}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("role.coordinator")}</p>
          <p className="text-xl font-bold text-blue-600">{users.coordinator}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("role.administrator")}</p>
          <p className="text-xl font-bold text-blue-600">{users.administrator}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t("dashboard.inactive")}</p>
          <p className="text-xl font-bold text-gray-400">{users.inactive}</p>
        </Card>
      </div>

      {/* ── Queue counters ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{t("dashboard.queues")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/app/staff/doctor-applications?status=pending" className="block">
          <Card>
            <p className="text-sm text-gray-500">{t("dashboard.pendingApplications")}</p>
            <p className="text-xl font-bold text-gray-900">{queues.pending_applications}</p>
          </Card>
        </Link>
        {isAdmin && (
          <>
            <Card>
              <p className="text-sm text-gray-500">{t("dashboard.pendingDeletions")}</p>
              <p className="text-xl font-bold text-gray-900">{queues.pending_deletions}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">{t("dashboard.pendingReports")}</p>
              <p className="text-xl font-bold text-gray-900">{queues.pending_reports}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">{t("dashboard.quarantinedAttachments")}</p>
              <p className="text-xl font-bold text-gray-900">{queues.quarantined_attachments}</p>
            </Card>
          </>
        )}
      </div>

      {/* ── Operations & Messages (visible to all staff) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500">{t("dashboard.totalNotifications")}</p>
          <p className="text-xl font-bold text-gray-900">{operations?.total_notifications ?? 0}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("message.unreadMessages")}</p>
              <p className="text-2xl font-bold text-primary-600">{messages.unread_messages}</p>
            </div>
            <Link to="/app/notifications">
              <Button variant="secondary" size="sm">{t("nav.notifications")}</Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Quick links ── */}
      <div className="flex gap-4 mt-6 mb-6 flex-wrap">
        <Link to="/app/staff/consultations">
          <Button>{t("nav.staffConsultations")}</Button>
        </Link>
        <Link to="/app/staff/doctor-applications">
          <Button variant="secondary">{t("nav.doctorApplications")}</Button>
        </Link>
        <Link to="/app/staff/doctors">
          <Button variant="secondary">{t("nav.doctorWorkload")}</Button>
        </Link>
      </div>
    </div>
  );
}
