/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RequireAuth, RequireRole, useAuth } from "../auth";
import { UserRole } from "../types";
import { I18nProvider } from "../i18n";
import { AppLayout } from "../components/layout/AppLayout";
import { LazyLoad } from "../components/common/LazyLoad";

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case UserRole.PATIENT:
      return <Navigate to="/app/patient" replace />;
    case UserRole.DOCTOR:
      return <Navigate to="/app/doctor" replace />;
    case UserRole.COORDINATOR:
    case UserRole.ADMINISTRATOR:
      return <Navigate to="/app/staff" replace />;
    default:
      return <Navigate to="/app/patient" replace />;
  }
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
const MedicalRecordPage = lazy(() => import("../pages/patient/MedicalRecordPage").then(m => ({ default: m.MedicalRecordPage })));
const MessagingPage = lazy(() => import("../pages/patient/MessagingPage").then(m => ({ default: m.MessagingPage })));
const NotificationsPage = lazy(() => import("../pages/patient/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import("../pages/patient/ProfilePage").then(m => ({ default: m.ProfilePage })));
const DoctorDashboard = lazy(() => import("../pages/doctor/DoctorDashboard").then(m => ({ default: m.DoctorDashboard })));
const DoctorConsultationList = lazy(() => import("../pages/doctor/DoctorConsultationList").then(m => ({ default: m.DoctorConsultationList })));
const DoctorConsultationDetail = lazy(() => import("../pages/doctor/DoctorConsultationDetail").then(m => ({ default: m.DoctorConsultationDetail })));
const StaffDashboard = lazy(() => import("../pages/doctor/StaffDashboard").then(m => ({ default: m.StaffDashboard })));
const StaffConsultationList = lazy(() => import("../pages/staff/StaffConsultationList").then(m => ({ default: m.StaffConsultationList })));
const StaffConsultationDetail = lazy(() => import("../pages/staff/StaffConsultationDetail").then(m => ({ default: m.StaffConsultationDetail })));
const DoctorWorkloadPage = lazy(() => import("../pages/staff/DoctorWorkloadPage").then(m => ({ default: m.DoctorWorkloadPage })));
const OperationsStatusPage = lazy(() => import("../pages/staff/OperationsStatusPage").then(m => ({ default: m.OperationsStatusPage })));
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
              { path: "messages/:consultationId", element: <MessagingPage /> },
              { path: "medical-records/:recordId", element: <MedicalRecordPage /> },
            ],
          },
          {
            path: "doctor",
            element: <RequireRole roles={[UserRole.DOCTOR]}><LazyLoad><Outlet /></LazyLoad></RequireRole>,
            children: [
              { index: true, element: <DoctorDashboard /> },
              { path: "consultations", element: <DoctorConsultationList /> },
              { path: "consultations/:consultationId", element: <DoctorConsultationDetail /> },
              { path: "messages/:consultationId", element: <MessagingPage /> },
            ],
          },
          {
            path: "staff",
            element: <RequireRole roles={[UserRole.COORDINATOR, UserRole.ADMINISTRATOR]}><LazyLoad><Outlet /></LazyLoad></RequireRole>,
            children: [
              { index: true, element: <StaffDashboard /> },
              { path: "consultations", element: <StaffConsultationList /> },
              { path: "consultations/:consultationId", element: <StaffConsultationDetail /> },
              { path: "doctors", element: <DoctorWorkloadPage /> },
              { path: "operations", element: <RequireRole roles={[UserRole.ADMINISTRATOR]}><OperationsStatusPage /></RequireRole> },
            ],
          },
          {
            path: "medical-records/:recordId",
            element: <LazyLoad><MedicalRecordPage /></LazyLoad>,
          },
        ],
      },
    ],
  },
]);
