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
    unassigned: number;
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
    pending_notifications: number;
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
