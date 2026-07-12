import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RequireAuth, RequireRole } from "../auth";
import { UserRole } from "../types";
import { AppLayout } from "../components/layout/AppLayout";
import { LandingPage } from "../pages/public/LandingPage";
import { DoctorListPage } from "../pages/public/DoctorListPage";
import { DoctorDetailPage } from "../pages/public/DoctorDetailPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { NotFoundPage } from "../pages/errors/NotFoundPage";
import { UnauthorizedPage } from "../pages/errors/UnauthorizedPage";
import { PatientDashboard } from "../pages/patient/PatientDashboard";
import { PatientConsultationList } from "../pages/patient/PatientConsultationList";
import { NewConsultationPage } from "../pages/patient/NewConsultationPage";
import { ConsultationDetailPage } from "../pages/patient/ConsultationDetailPage";
import { IntakePage } from "../pages/patient/IntakePage";
import { MedicalRecordPage } from "../pages/patient/MedicalRecordPage";
import { MessagingPage } from "../pages/patient/MessagingPage";
import { NotificationsPage } from "../pages/patient/NotificationsPage";
import { ProfilePage } from "../pages/patient/ProfilePage";
import { DoctorDashboard } from "../pages/doctor/DoctorDashboard";
import { DoctorConsultationList } from "../pages/doctor/DoctorConsultationList";
import { DoctorConsultationDetail } from "../pages/doctor/DoctorConsultationDetail";
import { StaffDashboard } from "../pages/doctor/StaffDashboard";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/doctors", element: <DoctorListPage /> },
  { path: "/doctors/:doctorId", element: <DoctorDetailPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/app",
    element: <RequireAuth><AppLayout><Outlet /></AppLayout></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/app/patient" replace /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "notifications", element: <NotificationsPage /> },
      {
        path: "patient",
        element: <RequireRole roles={[UserRole.PATIENT]}><Outlet /></RequireRole>,
        children: [
          { index: true, element: <PatientDashboard /> },
          { path: "consultations", element: <PatientConsultationList /> },
          { path: "consultations/new", element: <NewConsultationPage /> },
          { path: "consultations/:consultationId", element: <ConsultationDetailPage /> },
          { path: "consultations/:consultationId/intake", element: <IntakePage /> },
          { path: "messages/:consultationId", element: <MessagingPage /> },
        ],
      },
      {
        path: "doctor",
        element: <RequireRole roles={[UserRole.DOCTOR]}><Outlet /></RequireRole>,
        children: [
          { index: true, element: <DoctorDashboard /> },
          { path: "consultations", element: <DoctorConsultationList /> },
          { path: "consultations/:consultationId", element: <DoctorConsultationDetail /> },
          { path: "messages/:consultationId", element: <MessagingPage /> },
        ],
      },
      {
        path: "staff",
        element: <RequireRole roles={[UserRole.COORDINATOR, UserRole.ADMINISTRATOR]}><StaffDashboard /></RequireRole>,
      },
      {
        path: "medical-records/:recordId",
        element: <MedicalRecordPage />,
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
