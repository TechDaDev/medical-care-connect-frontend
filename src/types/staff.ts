export interface StaffDashboard {
  consultations: {
    total: number;
    submitted: number;
    accepted: number;
    intake_in_progress: number;
    intake_completed: number;
    doctor_review: number;
    cancelled: number;
    emergency_escalated: number;
    urgent: number;
    unassigned: number;
  };
  doctors: {
    approved: number;
    accepting: number;
    non_accepting: number;
  };
  unread_messages: number;
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
