/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RequireAuth, RequireRole, useAuth } from "../auth";
import { UserRole } from "../types";
import { I18nProvider, useI18n } from "../i18n";
import { AppLayout } from "../components/layout/AppLayout";
import { LazyLoad } from "../components/common/LazyLoad";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "../api/doctors";
import { DoctorAccessGate } from "../components/doctor/DoctorAccessGate";
import { ErrorState } from "../components/common/ErrorState";
import { Spinner } from "../components/common/Spinner";
import { getErrorMessage } from "../utils/errors";

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case UserRole.PATIENT:
      return <Navigate to="/app/patient" replace />;
    case UserRole.DOCTOR:
      return <DoctorRoleRedirect />;
    case UserRole.COORDINATOR:
    case UserRole.ADMINISTRATOR:
      return <Navigate to="/app/staff" replace />;
    default:
      return <Navigate to="/app/patient" replace />;
  }
}

function DoctorRoleRedirect() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ["doctor-access-state"], queryFn: doctorsApi.getAccessState });
  if (query.isLoading) return <div role="status" aria-label={t("doctor.access.loading")}><Spinner /></div>;
  if (query.error) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  return <Navigate to={query.data?.next_path || "/login"} replace />;
}

function DoctorHome() {
  return <DoctorAccessGate><DoctorDashboard /></DoctorAccessGate>;
}

const LandingPage = lazy(() => import("../pages/public/LandingPage").then(m => ({ default: m.LandingPage })));
const DoctorListPage = lazy(() => import("../pages/public/DoctorListPage").then(m => ({ default: m.DoctorListPage })));
const DoctorDetailPage = lazy(() => import("../pages/public/DoctorDetailPage").then(m => ({ default: m.DoctorDetailPage })));
const LoginPage = lazy(() => import("../pages/auth/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage").then(m => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import("../pages/errors/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const UnauthorizedPage = lazy(() => import("../pages/errors/UnauthorizedPage").then(m => ({ default: m.UnauthorizedPage })));
const ErrorPage = lazy(() => import("../pages/errors/ErrorPage").then(m => ({ default: m.ErrorPage })));
const PatientDashboard = lazy(() => import("../pages/patient/PatientDashboard").then(m => ({ default: m.PatientDashboard })));
const PatientConsultationList = lazy(() => import("../pages/patient/PatientConsultationList").then(m => ({ default: m.PatientConsultationList })));
const NewConsultationPage = lazy(() => import("../pages/patient/NewConsultationPage").then(m => ({ default: m.NewConsultationPage })));
const ConsultationDetailPage = lazy(() => import("../pages/patient/ConsultationDetailPage").then(m => ({ default: m.ConsultationDetailPage })));
const IntakePage = lazy(() => import("../pages/patient/IntakePage").then(m => ({ default: m.IntakePage })));
const MessagingPage = lazy(() => import("../pages/patient/MessagingPage").then(m => ({ default: m.MessagingPage })));
const NotificationsPage = lazy(() => import("../pages/patient/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import("../pages/patient/ProfilePage").then(m => ({ default: m.ProfilePage })));
const PatientProfilePage = lazy(() => import("../pages/patient/PatientProfilePage").then(m => ({ default: m.PatientProfilePage })));
const PatientMedicalRecordListPage = lazy(() => import("../pages/patient/PatientMedicalRecordListPage").then(m => ({ default: m.PatientMedicalRecordListPage })));
const PatientMedicalRecordPage = lazy(() => import("../pages/patient/PatientMedicalRecordPage").then(m => ({ default: m.PatientMedicalRecordPage })));
const PatientMessagesPage = lazy(() => import("../pages/patient/PatientMessagesPage").then(m => ({ default: m.PatientMessagesPage })));
const PatientNotificationsPage = lazy(() => import("../pages/patient/PatientNotificationsPage").then(m => ({ default: m.PatientNotificationsPage })));
const PatientPrivacyPage = lazy(() => import("../pages/patient/PatientPrivacyPage").then(m => ({ default: m.PatientPrivacyPage })));
const DoctorDashboard = lazy(() => import("../pages/doctor/DoctorDashboard").then(m => ({ default: m.DoctorDashboard })));
const DoctorConsultationList = lazy(() => import("../pages/doctor/DoctorConsultationList").then(m => ({ default: m.DoctorConsultationList })));
const DoctorConsultationDetail = lazy(() => import("../pages/doctor/DoctorConsultationDetail").then(m => ({ default: m.DoctorConsultationDetail })));
const DoctorReviewsPage = lazy(() => import("../pages/doctor/DoctorReviewsPage").then(m => ({ default: m.DoctorReviewsPage })));
const DoctorProfilePage = lazy(() => import("../pages/doctor/DoctorProfilePage").then(m => ({ default: m.DoctorProfilePage })));
const DoctorAccessStatePage = lazy(() => import("../pages/doctor/DoctorAccessStatePage").then(m => ({ default: m.DoctorAccessStatePage })));
const DoctorAvailabilityPage = lazy(() => import("../pages/doctor/DoctorAvailabilityPage").then(m => ({ default: m.DoctorAvailabilityPage })));
const StaffDashboard = lazy(() => import("../pages/doctor/StaffDashboard").then(m => ({ default: m.StaffDashboard })));
const StaffConsultationList = lazy(() => import("../pages/staff/StaffConsultationList").then(m => ({ default: m.StaffConsultationList })));
const StaffConsultationDetail = lazy(() => import("../pages/staff/StaffConsultationDetail").then(m => ({ default: m.StaffConsultationDetail })));
const StaffReviewsPage = lazy(() => import("../pages/staff/StaffReviewsPage").then(m => ({ default: m.StaffReviewsPage })));
const DoctorWorkloadPage = lazy(() => import("../pages/staff/DoctorWorkloadPage").then(m => ({ default: m.DoctorWorkloadPage })));
const OperationsStatusPage = lazy(() => import("../pages/staff/OperationsStatusPage").then(m => ({ default: m.OperationsStatusPage })));
const DoctorApplicationListPage = lazy(() => import("../pages/staff/DoctorApplicationListPage").then(m => ({ default: m.DoctorApplicationListPage })));
const DoctorApplicationDetailPage = lazy(() => import("../pages/staff/DoctorApplicationDetailPage").then(m => ({ default: m.DoctorApplicationDetailPage })));
const AdminUserListPage = lazy(() => import("../pages/staff/AdminUserListPage").then(m => ({ default: m.AdminUserListPage })));
const AdminUserDetailPage = lazy(() => import("../pages/staff/AdminUserDetailPage").then(m => ({ default: m.AdminUserDetailPage })));
const PrivacyRequestListPage = lazy(() => import("../pages/staff/PrivacyRequestListPage").then(m => ({ default: m.PrivacyRequestListPage })));
const PrivacyRequestDetailPage = lazy(() => import("../pages/staff/PrivacyRequestDetailPage").then(m => ({ default: m.PrivacyRequestDetailPage })));
const AuditEventListPage = lazy(() => import("../pages/staff/AuditEventListPage").then(m => ({ default: m.AuditEventListPage })));
const AuditEventDetailPage = lazy(() => import("../pages/staff/AuditEventDetailPage").then(m => ({ default: m.AuditEventDetailPage })));
const SpecialtyAdminListPage = lazy(() => import("../pages/staff/SpecialtyAdminListPage").then(m => ({ default: m.SpecialtyAdminListPage })));
const SpecialtyAdminDetailPage = lazy(() => import("../pages/staff/SpecialtyAdminDetailPage").then(m => ({ default: m.SpecialtyAdminDetailPage })));
const AttachmentAdminListPage = lazy(() => import("../pages/staff/AttachmentAdminListPage").then(m => ({ default: m.AttachmentAdminListPage })));
const AttachmentAdminDetailPage = lazy(() => import("../pages/staff/AttachmentAdminDetailPage").then(m => ({ default: m.AttachmentAdminDetailPage })));
const PrivacyPage = lazy(() => import("../pages/privacy/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const PrivacyExportsPage = lazy(() => import("../pages/privacy/PrivacyExportsPage").then(m => ({ default: m.PrivacyExportsPage })));
const PrivacyDeletionPage = lazy(() => import("../pages/privacy/PrivacyDeletionPage").then(m => ({ default: m.PrivacyDeletionPage })));

export const router = createBrowserRouter([
  {
    element: <I18nProvider><Outlet /></I18nProvider>,
    errorElement: <LazyLoad><ErrorPage /></LazyLoad>,
    children: [
      { path: "/", element: <LazyLoad><LandingPage /></LazyLoad>, errorElement: <LazyLoad><ErrorPage /></LazyLoad> },
      { path: "/doctors", element: <LazyLoad><DoctorListPage /></LazyLoad>, errorElement: <LazyLoad><ErrorPage /></LazyLoad> },
      { path: "/doctors/:doctorId", element: <LazyLoad><DoctorDetailPage /></LazyLoad>, errorElement: <LazyLoad><ErrorPage /></LazyLoad> },
      { path: "/login", element: <LazyLoad><LoginPage /></LazyLoad>, errorElement: <LazyLoad><ErrorPage /></LazyLoad> },
      { path: "/register", element: <LazyLoad><RegisterPage /></LazyLoad>, errorElement: <LazyLoad><ErrorPage /></LazyLoad> },
      { path: "/unauthorized", element: <LazyLoad><UnauthorizedPage /></LazyLoad>, errorElement: <LazyLoad><ErrorPage /></LazyLoad> },
      { path: "*", element: <LazyLoad><NotFoundPage /></LazyLoad> },
      {
        path: "/app",
        errorElement: <LazyLoad><ErrorPage /></LazyLoad>,
        element: <RequireAuth><AppLayout><Outlet /></AppLayout></RequireAuth>,
        children: [
          { index: true, element: <RoleBasedRedirect /> },
          { path: "profile", element: <LazyLoad><ProfilePage /></LazyLoad> },
          { path: "notifications", element: <LazyLoad><NotificationsPage /></LazyLoad> },
          { path: "privacy", element: <LazyLoad><PrivacyPage /></LazyLoad> },
          { path: "privacy/exports", element: <LazyLoad><PrivacyExportsPage /></LazyLoad> },
          { path: "privacy/deletion", element: <LazyLoad><PrivacyDeletionPage /></LazyLoad> },
          {
            path: "patient",
            element: <RequireRole roles={[UserRole.PATIENT]}><LazyLoad><Outlet /></LazyLoad></RequireRole>,
            children: [
              { index: true, element: <PatientDashboard /> },
              { path: "doctors", element: <DoctorListPage /> },
              { path: "doctors/:doctorId", element: <DoctorDetailPage /> },
              { path: "consultations", element: <PatientConsultationList /> },
              { path: "consultations/new", element: <NewConsultationPage /> },
              { path: "consultations/:consultationId", element: <ConsultationDetailPage /> },
              { path: "consultations/:consultationId/intake", element: <IntakePage /> },
              { path: "profile", element: <PatientProfilePage /> },
              { path: "messages", element: <PatientMessagesPage /> },
              { path: "messages/:consultationId", element: <MessagingPage /> },
              { path: "medical-records", element: <PatientMedicalRecordListPage /> },
              { path: "medical-records/:recordId", element: <PatientMedicalRecordPage /> },
              { path: "notifications", element: <PatientNotificationsPage /> },
              { path: "privacy", element: <PatientPrivacyPage /> },
              { path: "privacy/exports", element: <PrivacyExportsPage /> },
              { path: "privacy/deletion", element: <PrivacyDeletionPage /> },
            ],
          },
          {
            path: "doctor",
            element: <RequireRole roles={[UserRole.DOCTOR]}><LazyLoad><Outlet /></LazyLoad></RequireRole>,
            children: [
              { index: true, element: <DoctorHome /> },
              { path: "pending-approval", element: <DoctorAccessStatePage state="pending" /> },
              { path: "application-rejected", element: <DoctorAccessStatePage state="rejected" /> },
              { path: "suspended", element: <DoctorAccessStatePage state="suspended" /> },
              { path: "profile-missing", element: <DoctorAccessStatePage state="missing_profile" /> },
              { path: "profile", element: <DoctorAccessGate capability="profile"><LazyLoad><DoctorProfilePage /></LazyLoad></DoctorAccessGate> },
              { path: "availability", element: <DoctorAccessGate capability="availability"><DoctorAvailabilityPage /></DoctorAccessGate> },
              { path: "consultations", element: <DoctorAccessGate><DoctorConsultationList /></DoctorAccessGate> },
              { path: "consultations/:consultationId", element: <DoctorAccessGate><DoctorConsultationDetail /></DoctorAccessGate> },
              { path: "reviews", element: <DoctorAccessGate><DoctorReviewsPage /></DoctorAccessGate> },
              { path: "messages/:consultationId", element: <DoctorAccessGate><MessagingPage /></DoctorAccessGate> },
            ],
          },
          {
            path: "staff",
            element: <RequireRole roles={[UserRole.COORDINATOR, UserRole.ADMINISTRATOR]}><LazyLoad><Outlet /></LazyLoad></RequireRole>,
            children: [
              { index: true, element: <StaffDashboard /> },
              { path: "consultations", element: <StaffConsultationList /> },
              { path: "reviews", element: <StaffReviewsPage /> },
              { path: "consultations/:consultationId", element: <StaffConsultationDetail /> },
              { path: "doctors", element: <DoctorWorkloadPage /> },
              { path: "doctor-applications", element: <DoctorApplicationListPage /> },
              { path: "doctor-applications/:profileId", element: <DoctorApplicationDetailPage /> },
              { path: "users", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><AdminUserListPage /></RequireRole> },
              { path: "users/:userId", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><AdminUserDetailPage /></RequireRole> },
              { path: "operations", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><OperationsStatusPage /></RequireRole> },
              { path: "privacy-requests", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><PrivacyRequestListPage /></RequireRole> },
              { path: "privacy-requests/:requestId", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><PrivacyRequestDetailPage /></RequireRole> },
              { path: "audit", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><AuditEventListPage /></RequireRole> },
              { path: "audit/:eventId", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><AuditEventDetailPage /></RequireRole> },
              { path: "specialties", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><SpecialtyAdminListPage /></RequireRole> },
              { path: "specialties/:specialtyId", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><SpecialtyAdminDetailPage /></RequireRole> },
              { path: "attachments", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><AttachmentAdminListPage /></RequireRole> },
              { path: "attachments/:attachmentId", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><AttachmentAdminDetailPage /></RequireRole> },
            ],
          },
        ],
      },
    ],
  },
]);
