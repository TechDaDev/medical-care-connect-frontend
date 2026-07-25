export interface StaffDashboard {
  consultations: {
    total: number;
    draft: number;
    submitted: number;
    accepted: number;
    intake_in_progress: number;
    intake_completed: number;
    doctor_review: number;
    awaiting_patient_response: number;
    awaiting_doctor_response: number;
    under_review: number;
    follow_up_required: number;
    physical_visit_required: number;
    transferred: number;
    completed: number;
    cancelled: number;
    emergency_escalated: number;
    urgent: number;
  };
  doctors: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
    accepting: number;
    non_accepting: number;
  };
  users: {
    total: number;
    patient: number;
    doctor: number;
    coordinator: number;
    administrator: number;
    inactive: number;
  };
  queues: {
    pending_applications: number;
    pending_deletions: number;
    pending_reports: number;
    quarantined_attachments: number;
  };
  operations: {
    total_notifications: number;
  };
  messages: {
    unread_messages: number;
  };
  generated_at: string;
}

export interface OperationsStatus {
  version: string;
  release: string;
  commit: string;
  environment: string;
  database_available: boolean;
  attachment_backend_provider: string;
  attachment_root_writable: boolean;
  attachment_scan_mode: string;
  ai_enabled: boolean;
  error_monitor_provider: string;
  latest_migration: string;
  retention_candidates: number;
  degraded_components: string[];
}

export interface OperationsMetrics {
  uptime_seconds: number;
  users: Record<string, number>;
  consultations: Record<string, number>;
  attachments: { by_status: Record<string, number>; total_bytes: number };
  notifications_pending: number;
  retention_candidates: number;
}

export interface DoctorWorkload {
  id: string;
  full_name: string;
  specialty_name: string;
  is_approved: boolean;
  is_accepting_consultations: boolean;
  active_consultations: number;
  submitted: number;
  accepted: number;
  intake_completed: number;
  doctor_review: number;
  estimated_response_minutes: number;
}

export interface StaffConsultation {
  id: string;
  patient_name: string;
  doctor_name: string | null;
  specialty_name: string;
  status: string;
  priority: string;
  chief_complaint: string;
  created_at: string;
  updated_at: string;
}

export interface StaffConsultationDetail extends StaffConsultation {
  has_intake_session: boolean;
  has_medical_record: boolean;
  actions: import("./index").ConsultationActions;
  doctor_summary?: string;
  patient_summary?: string;
  transfer_history?: TransferRecord[];
  priority_history?: PriorityChangeRecord[];
}

export interface TransferRecord {
  id: string;
  from_doctor_name: string;
  to_doctor_name: string;
  reason: string;
  transferred_by_name: string;
  created_at: string;
}

export interface PriorityChangeRecord {
  id: string;
  old_priority: string;
  new_priority: string;
  reason?: string;
  changed_by_name: string;
  created_at: string;
}

export interface TransferRequest {
  doctor_id: string;
  reason: string;
}

export interface PriorityUpdate {
  priority: "routine" | "urgent" | "emergency";
  reason?: string;
}

// ── Doctor Application Types ───────────────────────────────────────────────

export type DoctorApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface DoctorApplicationListItem {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialty_name: string | null;
  professional_title: string;
  years_of_experience: number;
  workplace_name: string;
  approval_status: DoctorApplicationStatus;
  created_at: string;
  updated_at: string;
  has_license_document: boolean;
  license_document_verified: boolean;
}

export interface DoctorApplicationDetail {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  specialty_name: string | null;
  professional_title: string;
  workplace_name: string;
  biography: string;
  qualifications: string;
  years_of_experience: number;
  consultation_fee: string;
  languages: string[];
  estimated_response_minutes: number;
  approval_status: DoctorApplicationStatus;
  approval_note: string;
  created_at: string;
  updated_at: string;
  license_number_masked: string;
  has_license_document: boolean;
  license_document_verified: boolean;
  available_actions: string[];
}

export interface DoctorApplicationReviewInput {
  action: "approve" | "reject" | "suspend" | "reactivate";
  reason?: string;
  expected_status?: DoctorApplicationStatus;
}

export interface DoctorApplicationFilters {
  page?: number;
  page_size?: number;
  status?: DoctorApplicationStatus;
  specialty?: string;
  created_after?: string;
  created_before?: string;
  search?: string;
  ordering?: string;
}

// ── Admin User Management Types (Phase C) ──────────────────────────────────

export type AdminUserRole = "patient" | "doctor" | "coordinator" | "administrator";
export type AdminUserAction = "deactivate" | "activate" | "revoke_sessions" | "promote_to_administrator" | "demote_to_coordinator";

export interface AdminUserListItem {
  id: string;
  full_name: string;
  email: string;
  role: AdminUserRole;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login: string | null;
  profile_type: string | null;
  doctor_approval_status: string | null;
  available_actions: AdminUserAction[];
}

export interface AdminUserDetail {
  id: string;
  full_name: string;
  email: string;
  role: AdminUserRole;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  profile_type: string | null;
  doctor_approval_status: string | null;
  has_patient_profile: boolean;
  has_doctor_profile: boolean;
  available_actions: AdminUserAction[];
  active_refresh_tokens: number;
  last_token_created_at: string | null;
}

export interface AdminUserFilters {
  page?: number;
  page_size?: number;
  role?: AdminUserRole;
  active?: string;
  search?: string;
  created_after?: string;
  created_before?: string;
  last_login_after?: string;
  last_login_before?: string;
  ordering?: string;
}

export interface AdminUserStatusInput {
  is_active: boolean;
  reason: string;
  expected_is_active?: boolean;
}

export interface AdminUserRoleInput {
  role: "coordinator" | "administrator";
  reason: string;
  expected_role?: string;
}

export interface AdminUserSessionRevokeInput {
  reason: string;
}
