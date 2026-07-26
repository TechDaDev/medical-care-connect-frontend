export type SpecialtyAdminAction = "edit" | "activate" | "deactivate";

export interface AdminSpecialtyListItem {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  name_ckb: string;
  is_active: boolean;
  display_order: number;
  doctor_count: number;
  active_doctor_count: number;
  active_consultation_count: number;
  created_at: string;
  updated_at: string;
  available_actions: SpecialtyAdminAction[];
}

export interface AdminSpecialtyDetail extends AdminSpecialtyListItem {
  description: string;
}

export interface AdminSpecialtyWriteInput {
  code: string;
  name_en: string;
  name_ar: string;
  name_ckb: string;
  description?: string;
  display_order: number;
  expected_updated_at?: string;
}

export interface AdminSpecialtyFilters {
  page?: number;
  page_size?: number;
  active?: boolean;
  search?: string;
  ordering?: string;
}

export type AdminAttachmentStatus =
  | "pending"
  | "available"
  | "quarantined"
  | "rejected"
  | "deleted";

export type AdminAttachmentScanStatus =
  | "not_required"
  | "pending"
  | "clean"
  | "suspicious"
  | "infected"
  | "failed";

export type AttachmentAdminAction =
  | "rescan"
  | "reject"
  | "release"
  | "retention_delete"
  | "download";

export interface AdminAttachmentListItem {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: AdminAttachmentStatus;
  scanner_status: AdminAttachmentScanStatus;
  scanner_provider: string;
  scan_completed_at: string | null;
  owner_type: "consultation";
  owner_reference: string;
  created_at: string;
  updated_at: string;
  retention_eligible: boolean;
  available_actions: AttachmentAdminAction[];
}

export interface AttachmentActionHistory {
  id: string;
  event_type: string;
  created_at: string;
  safe_metadata: Record<string, string | number | boolean | null>;
}

export interface AdminAttachmentDetail extends AdminAttachmentListItem {
  file_extension: string;
  checksum: string;
  quarantine_reason: string;
  rejection_reason: string;
  action_history: AttachmentActionHistory[];
}

export interface AdminAttachmentFilters {
  page?: number;
  page_size?: number;
  status?: AdminAttachmentStatus;
  mime_type?: string;
  owner_type?: "consultation";
  scanner_result?: AdminAttachmentScanStatus;
  created_after?: string;
  created_before?: string;
  size_min?: number;
  size_max?: number;
  search?: string;
  ordering?: string;
}

export interface AttachmentAdminActionInput {
  reason: string;
  expected_status: AdminAttachmentStatus;
}
