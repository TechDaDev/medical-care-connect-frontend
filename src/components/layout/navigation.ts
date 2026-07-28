import { UserRole } from "../../types";

type Translate = (key: string) => string;

export function buildNavigationItems(role: UserRole, t: Translate) {
  if (role === UserRole.PATIENT) {
    return [
      { label: t("nav.dashboard"), path: "/app/patient" },
      { label: t("nav.findDoctor"), path: "/app/patient/doctors" },
      { label: t("nav.consultations"), path: "/app/patient/consultations" },
      { label: t("nav.medicalRecords"), path: "/app/patient/medical-records" },
      { label: t("nav.messages"), path: "/app/patient/messages" },
      { label: t("nav.notifications"), path: "/app/patient/notifications" },
      { label: t("nav.profile"), path: "/app/patient/profile" },
      { label: t("nav.privacy"), path: "/app/patient/privacy" },
    ];
  }
  if (role === UserRole.DOCTOR) {
    return [
      { label: t("nav.dashboard"), path: "/app/doctor" },
      { label: t("nav.consultations"), path: "/app/doctor/consultations" },
      { label: t("nav.availability"), path: "/app/doctor/availability" },
      { label: t("nav.reviews"), path: "/app/doctor/reviews" },
      { label: t("nav.notifications"), path: "/app/notifications" },
      { label: t("nav.profile"), path: "/app/doctor/profile" },
    ];
  }
  if (role === UserRole.ADMINISTRATOR) {
    return [
      { label: t("nav.dashboard"), path: "/app/staff" },
      { label: t("nav.staffConsultations"), path: "/app/staff/consultations" },
      { label: t("nav.doctorApplications"), path: "/app/staff/doctor-applications" },
      { label: t("nav.users"), path: "/app/staff/users" },
      { label: t("nav.staffReviews"), path: "/app/staff/reviews" },
      { label: t("nav.doctorWorkload"), path: "/app/staff/doctors" },
      { label: t("nav.privacyRequests"), path: "/app/staff/privacy-requests" },
      { label: t("nav.audit"), path: "/app/staff/audit" },
      { label: t("nav.specialties"), path: "/app/staff/specialties" },
      { label: t("nav.attachmentAdmin"), path: "/app/staff/attachments" },
      { label: t("nav.operations"), path: "/app/staff/operations" },
      { label: t("nav.notifications"), path: "/app/notifications" },
      { label: t("nav.profile"), path: "/app/profile" },
    ];
  }
  return [
    { label: t("nav.dashboard"), path: "/app/staff" },
    { label: t("nav.staffConsultations"), path: "/app/staff/consultations" },
    { label: t("nav.doctorApplications"), path: "/app/staff/doctor-applications" },
    { label: t("nav.staffReviews"), path: "/app/staff/reviews" },
    { label: t("nav.doctorWorkload"), path: "/app/staff/doctors" },
    { label: t("nav.notifications"), path: "/app/notifications" },
    { label: t("nav.profile"), path: "/app/profile" },
  ];
}
