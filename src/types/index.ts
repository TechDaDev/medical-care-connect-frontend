export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  role: UserRole;
  is_active: boolean;
  is_staff?: boolean;
  date_joined: string;
  updated_at?: string;
}

export enum UserRole {
  PATIENT = "patient",
  DOCTOR = "doctor",
  COORDINATOR = "coordinator",
  ADMINISTRATOR = "administrator",
}

export type AccountType = "patient" | "doctor";
export type DoctorApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface DoctorRegistrationInput {
  first_name: string; last_name: string; email: string; phone_number: string;
  password: string; password_confirm: string; specialty: string;
  medical_license_number: string; years_of_experience: number; workplace_name: string;
  professional_bio: string; languages: string[];
  medical_license_document: File;
}

export interface DoctorRegistrationResponse {
  user: Pick<User, "id" | "role" | "first_name" | "last_name">;
  doctor_profile: { id: string; approval_status: DoctorApplicationStatus };
  next_path: string;
}

export interface PatientProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  date_of_birth: string | null;
  gender: string;
  preferred_language: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  specialty: string;
  specialty_name: string;
  professional_title: string;
  workplace_name?: string;
  approval_status?: DoctorApplicationStatus;
  qualifications: string;
  biography: string;
  years_of_experience: number;
  consultation_fee: string;
  languages: string[];
  is_approved: boolean;
  is_accepting_consultations: boolean;
  estimated_response_minutes: number;
  has_license_document?: boolean;
  license_document_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Strict update shape — only fields a doctor is allowed to edit. */
export interface DoctorProfileUpdateInput {
  specialty?: string;
  professional_title?: string;
  workplace_name?: string;
  qualifications?: string;
  biography?: string;
  years_of_experience?: number;
  consultation_fee?: string | number;
  languages?: string[];
  estimated_response_minutes?: number;
}

export interface DoctorPublicProfile {
  id: string;
  full_name: string;
  specialty: string;
  specialty_name: string;
  professional_title: string;
  qualifications: string;
  biography: string;
  years_of_experience: number;
  consultation_fee: string;
  languages: string[];
  is_accepting_consultations: boolean;
  estimated_response_minutes: number;
  created_at?: string;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationActions {
  can_accept: boolean;
  can_cancel: boolean;
  can_message: boolean;
  can_start_intake: boolean;
  can_view_record: boolean;
  can_add_internal_note: boolean;
  can_transfer: boolean;
  can_change_priority: boolean;
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
    specialty_name?: string;
  } | null;
  specialty: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  status: ConsultationStatus;
  priority: string;
  description: string;
  cancellation_reason?: string;
  actions?: ConsultationActions;
  has_intake_session?: boolean;
  has_medical_record?: boolean;
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

export interface ConsultationReview {
  id: string;
  consultation: string;
  reviewer: string;
  reviewer_name: string;
  doctor_id: string;
  doctor_name: string;
  rating: number;
  title: string;
  body: string;
  is_anonymous: boolean;
  status: string;
  consultation_status: string;
  has_response: boolean;
  response?: {
    id: string;
    review: string;
    doctor: string;
    body: string;
    created_at: string;
    updated_at: string;
  } | null;
  report_count?: number;
  edit_count: number;
  last_edited_at: string | null;
  moderated_at?: string | null;
  moderation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorReputation {
  doctor_id: string;
  doctor_name: string;
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
  response_rate: number;
  recent_ratings_trend: string;
}

export interface ReviewReport {
  id: string;
  review: string;
  reporter: string;
  reason: string;
  description: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution: string;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  code?: string;
  fields?: Record<string, string[]>;
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

export interface PatientDashboardData {
  consultations: {
    total: number;
    active: number;
    awaiting_patient: number;
    awaiting_doctor: number;
    completed: number;
  };
  unread_messages: number;
  unread_notifications: number;
  recent_consultations: Array<{
    id: string;
    status: string;
    doctor_name: string;
    specialty_name: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface DoctorDashboardData {
  consultations: {
    total_active: number;
    submitted: number;
    accepted: number;
    intake_completed: number;
    doctor_review: number;
    awaiting_patient: number;
    awaiting_doctor: number;
  };
  unread_messages: number;
  unread_notifications: number;
  profile: {
    is_approved: boolean;
    is_accepting_consultations: boolean;
  };
}

export interface UnreadCount {
  consultation_id: string;
  unread_count: number;
}

export interface NotificationUnreadCount {
  unread_count: number;
}
