export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
}

export enum UserRole {
  PATIENT = "patient",
  DOCTOR = "doctor",
  COORDINATOR = "coordinator",
  ADMINISTRATOR = "administrator",
}

export interface PatientProfile {
  id: string;
  user: string;
  date_of_birth: string | null;
  gender: string;
  preferred_language: string;
  address: string;
  emergency_contact: string;
  blood_type: string;
}

export interface DoctorProfile {
  id: string;
  user: string;
  specialty: Specialty | null;
  professional_title: string;
  qualifications: string;
  biography: string;
  years_of_experience: number;
  consultation_fee: string;
  languages: string[];
  estimated_response_time: string;
  is_approved: boolean;
  is_accepting_consultations: boolean;
}

export interface DoctorPublicProfile {
  id: string;
  user: {
    id: string;
    full_name: string;
  };
  specialty: Specialty | null;
  professional_title: string;
  qualifications: string;
  biography: string;
  years_of_experience: number;
  consultation_fee: string;
  languages: string[];
  estimated_response_time: string;
  is_accepting_consultations: boolean;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Consultation {
  id: string;
  patient: {
    id: string;
    user: { id: string; full_name: string };
  };
  doctor: {
    id: string;
    user: { id: string; full_name: string };
    specialty: Specialty | null;
  } | null;
  specialty: Specialty | null;
  status: ConsultationStatus;
  priority: string;
  description: string;
  chief_complaint?: string;
  patient_note?: string;
  cancellation_reason: string;
  submitted_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export enum ConsultationStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  ACCEPTED = "accepted",
  INTAKE_IN_PROGRESS = "intake_in_progress",
  INTAKE_COMPLETED = "intake_completed",
  DOCTOR_REVIEW = "doctor_review",
  AWAITING_PATIENT_RESPONSE = "awaiting_patient_response",
  AWAITING_DOCTOR_RESPONSE = "awaiting_doctor_response",
  UNDER_REVIEW = "under_review",
  FOLLOW_UP_REQUIRED = "follow_up_required",
  PHYSICAL_VISIT_REQUIRED = "physical_visit_required",
  TRANSFERRED = "transferred",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EMERGENCY_ESCALATED = "emergency_escalated",
}

export interface AIIntakeSession {
  id: string;
  consultation: string;
  status: string;
  messages: AIIntakeMessage[];
  question_count: number;
  is_complete: boolean;
  ready_for_review: boolean;
  emergency_detected: boolean;
  emergency_keyword: string;
  emergency_instruction: string;
}

export interface AIIntakeMessage {
  id: string;
  role: "ai" | "patient" | "system";
  content: string;
  created_at: string;
}

export interface MedicalRecordDraft {
  id: string;
  consultation: string;
  status: string;
  chief_complaint: string;
  symptoms: string;
  duration: string;
  severity: string;
  associated_symptoms: string;
  chronic_conditions: string;
  current_medications: string;
  allergies: string;
  surgical_history: string;
  family_history: string;
  pregnancy_status: string;
  relevant_test_results: string;
  additional_information: string;
  missing_information: string;
  emergency_summary: string;
  doctor_notes: string;
  ai_generated_summary: string;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
}

export interface ConsultationMessage {
  id: string;
  consultation: string;
  sender: string;
  sender_email: string;
  sender_name: string;
  message_type: "text" | "system";
  content: string;
  is_system_message: boolean;
  sent_at: string;
  edited_at: string | null;
  read_by: { user_id: string; read_at: string }[];
}

export interface DoctorInternalNote {
  id: string;
  consultation: string;
  author: string;
  author_email: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient: string;
  notification_type: string;
  title: string;
  body: string;
  consultation: string | null;
  related_message: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface UnreadCount {
  consultation_id: string;
  unread_count: number;
}

export interface NotificationUnreadCount {
  unread_count: number;
}
