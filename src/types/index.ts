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

export interface PatientProfileComposite {
  account: Pick<
    User,
    | "id"
    | "email"
    | "first_name"
    | "last_name"
    | "full_name"
    | "phone_number"
    | "date_joined"
    | "updated_at"
  >;
  profile: PatientProfile;
  completion: {
    percent: number;
    missing_fields: string[];
    personal_information_complete: boolean;
    contact_information_complete: boolean;
    emergency_contact_complete: boolean;
    basic_health_complete: boolean;
  };
  generated_at: string;
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
  completeness?: { completion_percent: number; missing_fields: string[] };
  public_preview?: { eligible: boolean; path: string | null };
  links?: { availability: string; privacy: string };
}

/** Strict update shape — only fields a doctor is allowed to edit. */
export interface DoctorProfileUpdateInput {
  specialty?: string;
  professional_title?: string;
  workplace_name?: string;
  qualifications?: string;
  biography?: string;
  years_of_experience?: number;
  consultation_fee?: string | number | null;
  languages?: string[];
  estimated_response_minutes?: number;
}

export interface MoneyAmount {
  amount: string;
  currency: string;
}

export interface DoctorSpecialtySummary {
  id: string;
  slug: string;
  name: string;
}

export type DoctorAvailableAction = "view" | "start_consultation";
export type DoctorUnavailableReason =
  | "not_accepting_consultations"
  | "specialty_inactive"
  | "account_inactive"
  | "profile_not_approved";
export type DoctorListOrdering =
  | "relevance"
  | "name"
  | "experience_desc"
  | "fee_asc"
  | "fee_desc"
  | "response_time_asc"
  | "newest";

export interface DoctorListItem {
  id: string;
  full_name: string;
  specialty: DoctorSpecialtySummary;
  professional_title: string;
  workplace_name: string;
  years_of_experience: number;
  consultation_fee: MoneyAmount;
  languages: string[];
  is_accepting_consultations: boolean;
  estimated_response_minutes: number;
  average_rating: number;
  total_reviews: number;
  profile_summary: string;
  available_actions: DoctorAvailableAction[];
}

export interface DoctorDetail extends DoctorListItem {
  qualifications: string;
  biography: string;
  unavailable_reason: DoctorUnavailableReason | null;
  created_at: string;
  updated_at: string;
}

/** Compatibility alias for older imports. */
export type DoctorPublicProfile = DoctorDetail;

export interface DoctorSearchFilters {
  search?: string;
  specialty?: string;
  specialty_slug?: string;
  language?: "en" | "ar" | "ckb";
  accepting?: boolean;
  min_experience?: number;
  min_fee?: string;
  max_fee?: string;
  max_response_minutes?: number;
  ordering?: DoctorListOrdering;
  page?: number;
  page_size?: number;
  locale?: "en" | "ar" | "ckb";
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
  can_emergency_escalate: boolean;
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

export interface DoctorConsultationQueueItem {
  id: string;
  status: ConsultationStatus;
  priority: string;
  patient: { id: string; display_name: string; age_group: string | null; gender: string | null };
  specialty: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  accepted_at: string | null;
  unread_messages: number;
  needs_doctor_action: boolean;
  doctor_action_type: string | null;
  has_completed_intake: boolean;
  has_medical_record: boolean;
  attachment_count: number;
  available_actions: string[];
}

export interface DoctorConsultationActions {
  can_accept: boolean;
  can_begin_review: boolean;
  can_request_patient_response: boolean;
  can_mark_awaiting_doctor: boolean;
  can_require_follow_up: boolean;
  can_require_physical_visit: boolean;
  can_transfer: boolean;
  can_emergency_escalate: boolean;
  can_complete: boolean;
  can_message: boolean;
  can_add_internal_note: boolean;
  can_upload_attachment: boolean;
  can_view_record_summary: boolean;
}

export interface DoctorConsultationDetail {
  id: string;
  status: ConsultationStatus;
  priority: string;
  patient: {
    id: string; display_name: string; date_of_birth: string | null;
    age: number | null; gender: string | null; preferred_language: string | null;
    blood_type: string | null;
  };
  specialty: { id: string; name: string } | null;
  description: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  timeline: ConsultationTimelineItem[];
  actions: DoctorConsultationActions;
  action_reasons: Record<string, string | null>;
  intake: {
    exists: boolean; status: string | null; question_count: number; answered_count: number;
    is_complete: boolean; emergency_detected: boolean; completed_at: string | null;
    doctor_safe_summary: Record<string, unknown> | null;
  };
  messages: { unread_count: number; last_message_at: string | null; patient_awaiting_response: boolean };
  attachments: {
    total: number; available: number; pending_scan: number; quarantined: number;
    rejected: number; can_upload: boolean; upload_unavailable_reason: string | null;
  };
  internal_notes: { count: number; latest_at: string | null };
  medical_record: { exists: boolean; id: string | null; status: string | null; can_view_summary: boolean; can_create_record: boolean; action_path: string | null };
  generated_at: string;
}

export interface DoctorRecordPatientReported {
  reported_concern: string | null;
  symptoms: string[];
  duration: string | null;
  severity: number | null;
  chronic_conditions: string | null;
  current_medications: string[];
  allergies: string[];
  family_history: string | null;
  additional_information: string | null;
}

export interface DoctorRecordAuthoredFields {
  clinical_summary: string;
  assessment: string;
  working_diagnosis: string;
  differential_considerations: string;
  recommendations: string;
  treatment_plan: string;
  follow_up_plan: string;
  physical_visit_reason: string;
  warning_signs: string;
  patient_instructions: string;
  doctor_notes: string;
}

export interface DoctorRecordValidation {
  can_finalize: boolean;
  missing_fields: string[];
  warnings: string[];
  blocking_errors: string[];
}

export interface DoctorRecordActions {
  can_edit: boolean;
  can_finalize: boolean;
  can_amend: boolean;
  can_print: boolean;
  can_complete_consultation: boolean;
  can_require_follow_up: boolean;
  can_require_physical_visit: boolean;
}

export interface DoctorRecordActionReasons {
  edit: string | null;
  finalize: string | null;
  amend: string | null;
  complete_consultation: string | null;
}

export interface DoctorRecordAiSuggestions {
  available: boolean;
  fields: Partial<DoctorRecordAuthoredFields> | null;
  generated_at: string | null;
  disclaimer_key: string;
}

export interface DoctorMedicalRecordListItem {
  id: string;
  consultation_id: string;
  patient: { id: string; display_name: string };
  specialty: { id: string; name: string } | null;
  record_status: "draft" | "finalized";
  consultation_status: ConsultationStatus;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  needs_doctor_action: boolean;
  completion_blocked_reason: string | null;
  available_actions: string[];
}

export interface DoctorMedicalRecordDetail {
  id: string;
  consultation_id: string;
  record_status: "draft" | "finalized";
  version: number;
  patient: { id: string; display_name: string; date_of_birth: string | null; gender: string | null; preferred_language: string | null; blood_type: string | null };
  consultation: { status: ConsultationStatus; priority: string; specialty_name: string | null; description: string; created_at: string; updated_at: string };
  patient_reported: DoctorRecordPatientReported;
  intake_reference: { exists: boolean; is_complete: boolean; emergency_detected: boolean; summary_available: boolean; action_path: string | null };
  doctor_authored: DoctorRecordAuthoredFields;
  ai_suggestions: DoctorRecordAiSuggestions;
  validation: DoctorRecordValidation;
  actions: DoctorRecordActions;
  action_reasons: DoctorRecordActionReasons;
  provenance: Record<string, string>;
  clinical_outcome: string;
  outcome_recorded_at: string | null;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  finalized_by: { id: string; display_name: string } | null;
}

export interface DoctorRecordListFilters {
  record_status?: string;
  consultation_status?: string;
  patient?: string;
  specialty?: string;
  needs_doctor_action?: boolean;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface CreateMedicalRecordInput { client_request_id: string }
export interface UpdateMedicalRecordInput { doctor_authored: Partial<DoctorRecordAuthoredFields>; expected_version: number; client_request_id: string }
export interface FinalizeMedicalRecordInput { expected_version: number; client_request_id: string; confirmation: boolean }
export interface ClinicalOutcomeInput { action: string; outcome: string; medical_record_id: string; confirmation: boolean; reason?: string; target_doctor_id?: string; expected_status: string; expected_updated_at?: string; client_request_id: string }

export interface DoctorIntakeDetail {
  session_id: string;
  consultation_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  submitted_at: string | null;
  question_count: number;
  answered_count: number;
  language: string;
  prompt_version: string;
  schema_version: string;
  emergency_detected: boolean;
  emergency_level: string;
  patient_confirmed: boolean;
  ai_assisted: boolean;
  patient_answers: Array<{ id: string; question_label: string; answer: string; created_at: string }>;
  doctor_safe_summary: Record<string, unknown> | null;
  field_projection: Record<string, {
    value: unknown;
    status: string;
    source: string;
    confirmed_by_patient: boolean;
    evidence_message_ids: string[];
  }>;
  missing_fields: string[];
  uncertainty_fields: string[];
  missing_non_blocking: string[];
  can_begin_review: boolean;
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

export interface PatientConsultationDoctor {
  id: string;
  full_name: string;
  professional_title: string;
  specialty_name: string;
  is_accepting_consultations?: boolean;
}

export interface PatientConsultationListItem {
  id: string;
  status: ConsultationStatus;
  priority: string;
  doctor: PatientConsultationDoctor | null;
  specialty: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  unread_messages: number;
  needs_patient_action: boolean;
  has_active_intake: boolean;
  has_medical_record: boolean;
  has_review: boolean;
  available_actions: string[];
}

export interface ConsultationTimelineItem {
  key: string;
  status: "completed" | "current" | "upcoming" | "terminal";
  occurred_at: string | null;
  title_key: string;
  description_key: string;
}

export interface PatientConsultationActions {
  can_cancel: boolean;
  can_message: boolean;
  can_start_intake: boolean;
  can_continue_intake: boolean;
  can_view_record: boolean;
  can_write_review: boolean;
  can_upload_attachment: boolean;
}

export interface PatientConsultationDetail {
  id: string;
  status: ConsultationStatus;
  priority: string;
  doctor: PatientConsultationDoctor | null;
  specialty: { id: string; name: string } | null;
  description: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  timeline: ConsultationTimelineItem[];
  actions: PatientConsultationActions;
  action_reasons: Record<string, string | null>;
  intake_summary: {
    exists: boolean; status: string | null; question_count: number;
    is_complete: boolean; emergency_detected: boolean; updated_at: string | null;
  };
  messages_summary: { unread_count: number; last_message_at: string | null };
  attachments_summary: {
    total: number; available: number; pending_scan: number; quarantined: number;
  };
  medical_record_summary: {
    exists: boolean; id: string | null; status: string | null; updated_at: string | null;
  };
  review_summary: { exists: boolean; status: string | null; can_edit: boolean };
  generated_at: string;
}

export interface AIIntakeSession {
  id: string;
  consultation: string;
  status: string;
  language: string;
  current_question: string;
  question_count: number;
  answered_count: number;
  is_complete: boolean;
  ready_for_review: boolean;
  can_send_message: boolean;
  can_complete: boolean;
  can_confirm: boolean;
  can_submit: boolean;
  emergency_detected: boolean;
  emergency_level: string;
  emergency_instruction: string;
  started_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  submitted_at: string | null;
  updated_at: string;
  messages: AIIntakeMessage[];
  progress_percent: number;
  missing_blocking_fields: string[];
}

export interface AIIntakeMessage {
  id: string;
  role: "assistant" | "patient" | "system";
  content: string;
  sequence_number: number;
  created_at: string;
}

export interface IntakeAnswerResponse {
  conversation_status?: string;
  session_status: string;
  patient_facing_message: string;
  next_question: string | null;
  next_question_field?: string | null;
  question_count: number;
  emergency_detected: boolean;
  emergency_level: string;
  emergency_reasons?: string[];
  record_ready: boolean;
  submitted_to_doctor?: boolean;
  error_code?: string;
  retryable?: boolean;
  replayed?: boolean;
  completeness?: {
    missing_blocking_fields: string[];
    can_generate_review_summary: boolean;
    reason_code: string;
    questions_remaining: number;
  } | null;
}

export interface IntakeReviewField {
  value: unknown;
  status: "answered" | "unknown" | "declined" | "uncertain" | "not_applicable" | "missing";
  source: string;
  evidence_message_ids: string[];
  confirmed_by_patient: boolean;
}

export interface IntakeReview {
  session_id: string;
  session_status: string;
  consultation_id?: string;
  review: {
    sections: Record<string, IntakeReviewField>;
    ai_generated_summary: string | null;
    generated_at: string;
    prompt_version: string;
    schema_version: string;
  };
  can_confirm: boolean;
  can_correct: boolean;
  can_submit: boolean;
  updated_at: string;
  missing_blocking_fields?: string[];
}

export interface MedicalRecordDraft {
  id: string;
  consultation: string;
  status: string;
  chief_complaint: string;
  history_of_present_illness: string;
  symptoms: string[];
  duration: string;
  severity: number | null;
  onset_date: string | null;
  location: string;
  triggers: string;
  relieving_factors: string;
  past_medical_history: string;
  medications: string[];
  allergies: string[];
  family_history: string;
  social_history: string;
  review_of_systems: string;
  additional_notes?: string;
  doctor_notes?: string;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
}

export interface PatientDoctorSummary {
  id: string;
  full_name: string;
  specialty_name: string | null;
}

export interface PatientMedicalRecordListItem {
  id: string;
  consultation_id: string;
  doctor: PatientDoctorSummary;
  status: string;
  chief_complaint_summary: string | null;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  available_actions: string[];
}

export interface PatientMedicalRecord {
  id: string;
  consultation_id: string;
  doctor: PatientDoctorSummary;
  specialty: { id: string; name: string } | null;
  status: string;
  chief_complaint: string;
  history_of_present_illness: string;
  symptoms: string[];
  severity: number | null;
  onset_date: string | null;
  duration: string;
  location: string;
  triggers: string;
  relieving_factors: string;
  past_medical_history: string;
  medications: string[];
  allergies: string[];
  family_history: string;
  social_history: string;
  review_of_systems: string;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
}

export interface PatientMessageThread {
  consultation_id: string;
  doctor: PatientDoctorSummary | null;
  consultation_status: string;
  unread_count: number;
  last_message_at: string | null;
  last_message_sender_role: string | null;
  last_message_preview: string | null;
  messaging_available: boolean;
  unavailable_reason: string | null;
  available_actions: string[];
}

export interface ConsultationMessage {
  id: string;
  consultation: string;
  sender: string;
  sender_name: string;
  message_type: "text" | "system";
  content: string;
  is_system_message: boolean;
  sent_at: string;
  edited_at: string | null;
  is_read_by_current_user: boolean;
}

export interface DoctorInternalNote {
  id: string;
  author: { id: string; display_name: string; role: string };
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  link: {
    type: "consultation" | "message" | "medical_record" | "review" | "privacy" | "profile" | "none";
    path: string | null;
  };
}

export interface DoctorMessageThread {
  consultation_id: string;
  patient: { id: string; display_name: string };
  specialty: { id: string; name: string } | null;
  consultation_status: string;
  priority: string;
  unread_count: number;
  last_message_at: string | null;
  last_message_sender_role: string | null;
  last_message_preview: string | null;
  patient_awaiting_response: boolean;
  messaging_available: boolean;
  unavailable_reason: string | null;
  action_path: string;
}

export interface DoctorReviewItem {
  id: string;
  rating: number;
  title: string;
  body: string;
  is_anonymous: boolean;
  reviewer_display_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  has_response: boolean;
  response: { id: string; body: string; created_at: string; updated_at: string } | null;
  can_respond: boolean;
  can_edit_response: boolean;
  response_unavailable_reason: string | null;
}

export interface DoctorReviewPage extends PaginatedResponse<DoctorReviewItem> {
  summary: {
    average_rating: number;
    total_published: number;
    awaiting_response: number;
    responded: number;
    rating_distribution: Record<string, number>;
  };
}

export interface DoctorDataExport {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "expired";
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  size_bytes: number | null;
  failure_code: string;
}

export interface DoctorDeletionRequest {
  id: string;
  status: string;
  reason: string;
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string;
  can_cancel: boolean;
}

export interface DoctorPrivacyOverview {
  profile_visibility: "public" | "private";
  profile_completion: { completion_percent: number; missing_fields: string[] };
  active_export: boolean;
  active_deletion_request: DoctorDeletionRequest | null;
  retention: { clinical_records_may_be_retained: boolean; audit_records_may_be_retained: boolean };
  links: { exports: string; deletion: string; profile: string };
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

export interface PatientDashboardConsultations {
  total: number;
  active: number;
  awaiting_patient: number;
  awaiting_doctor: number;
  intake_in_progress: number;
  doctor_review: number;
  follow_up_required: number;
  physical_visit_required: number;
  emergency_escalated: number;
  completed: number;
  cancelled: number;
}

export type PatientAttentionType =
  | "awaiting_patient_response"
  | "follow_up_required"
  | "physical_visit_required"
  | "emergency_escalated"
  | "intake_incomplete"
  | "unread_messages";

export interface PatientAttentionItem {
  type: PatientAttentionType;
  consultation_id: string | null;
  title_key: string;
  description_key: string;
  count: number;
  severity: "info" | "warning" | "danger";
  created_at: string | null;
  action_path: string | null;
}

export interface PatientDashboardMessageThread {
  consultation_id: string;
  doctor_name: string | null;
  specialty_name: string | null;
  unread_count: number;
  last_message_at: string | null;
}

export interface PatientDashboardMessages {
  unread_total: number;
  recent_threads: PatientDashboardMessageThread[];
}

export interface PatientDashboardNotification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  consultation_id: string | null;
}

export interface PatientDashboardNotifications {
  unread_total: number;
  recent: PatientDashboardNotification[];
}

export interface PatientDashboardProfile {
  completion_percent: number;
  missing_fields: string[];
  emergency_contact_complete: boolean;
  basic_health_complete: boolean;
}

export interface PatientDashboardRecentConsultation {
  id: string;
  status: ConsultationStatus;
  doctor_name: string | null;
  specialty_name: string | null;
  created_at: string;
  updated_at: string;
  unread_messages: number;
  needs_patient_action: boolean;
  has_medical_record: boolean;
  medical_record_id: string | null;
}

export interface PatientDashboardData {
  consultations: PatientDashboardConsultations;
  attention: {
    total: number;
    items: PatientAttentionItem[];
  };
  messages: PatientDashboardMessages;
  notifications: PatientDashboardNotifications;
  profile: PatientDashboardProfile;
  recent_consultations: PatientDashboardRecentConsultation[];
  generated_at: string;
}

export interface DoctorDashboardData {
  access: DoctorAccessState;
  profile: {
    id: string;
    full_name: string;
    professional_title: string;
    specialty_name: string | null;
    approval_status: DoctorApplicationStatus;
    is_approved: boolean;
    is_accepting_consultations: boolean;
    completion_percent: number;
    missing_fields: string[];
  };
  consultations: {
    total_active: number;
    submitted: number;
    accepted: number;
    intake_in_progress: number;
    intake_completed: number;
    doctor_review: number;
    awaiting_patient: number;
    awaiting_doctor: number;
    under_review: number;
    follow_up_required: number;
    physical_visit_required: number;
    transferred: number;
    emergency_escalated: number;
    completed: number;
    cancelled: number;
  };
  attention: {
    total: number;
    items: DoctorAttentionItem[];
  };
  messages: {
    unread_total: number;
    recent_threads: DoctorMessageThread[];
  };
  notifications: {
    unread_total: number;
    recent: DoctorDashboardNotification[];
  };
  reviews: {
    total_reviews: number;
    average_rating: number;
    awaiting_response: number;
    recent: DoctorDashboardReview[];
  };
  availability: DoctorAvailabilitySummary;
  recent_consultations: DoctorDashboardConsultation[];
  generated_at: string;
}

export type DoctorAccessStateName =
  | "approved"
  | "pending"
  | "rejected"
  | "suspended"
  | "missing_profile"
  | "inactive";

export interface DoctorAccessState {
  state: DoctorAccessStateName;
  can_access_dashboard: boolean;
  can_manage_availability: boolean;
  can_accept_consultations: boolean;
  can_edit_profile: boolean;
  reason_code: string | null;
  approval_status: DoctorApplicationStatus | null;
  is_approved: boolean;
  is_accepting_consultations: boolean;
  profile_id: string | null;
  updated_at: string | null;
  next_path: string;
}

export interface DoctorAttentionItem {
  type: string;
  consultation_id: string | null;
  review_id: string | null;
  count: number;
  severity: "info" | "warning" | "danger";
  title_key: string;
  description_key: string;
  created_at: string | null;
  action_path: string | null;
}

export interface DoctorMessageThread {
  consultation_id: string;
  patient_display_name: string;
  consultation_status: string;
  unread_count: number;
  last_message_at: string | null;
  action_path: string;
}

export interface DoctorDashboardNotification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  action_path: string | null;
}

export interface DoctorDashboardReview {
  id: string;
  consultation_id: string;
  rating: number;
  is_anonymous: boolean;
  has_response: boolean;
  created_at: string;
  action_path: string;
}

export interface DoctorAvailabilitySummary {
  timezone: string | null;
  is_accepting_consultations: boolean;
  can_toggle_accepting: boolean;
  toggle_unavailable_reason: string | null;
  active_slot_count: number;
  next_available_start: string | null;
}

export interface DoctorDashboardConsultation {
  id: string;
  patient_display_name: string;
  specialty: { id: string; name: string } | null;
  status: string;
  priority: string;
  unread_messages: number;
  needs_doctor_action: boolean;
  updated_at: string;
  action_path: string;
}

export interface DoctorAvailabilitySlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  updated_at: string;
  version: string;
}

export interface DoctorAvailabilityData {
  timezone: string;
  is_accepting_consultations: boolean;
  can_manage: boolean;
  slots: DoctorAvailabilitySlot[];
  generated_at: string;
}

export interface DoctorAvailabilityInput {
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
  expected_updated_at?: string;
}

export interface DoctorAcceptingStatusResponse extends DoctorAvailabilitySummary {
  changed: boolean;
  reason: string;
  profile_updated_at: string;
}

export interface UnreadCount {
  consultation_id: string;
  unread_count: number;
}

export interface NotificationUnreadCount {
  unread_count: number;
}
