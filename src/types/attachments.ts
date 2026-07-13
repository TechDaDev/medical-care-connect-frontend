export enum AttachmentCategory {
  MEDICAL_REPORT = "medical_report",
  LABORATORY_RESULT = "laboratory_result",
  MEDICAL_IMAGE = "medical_image",
  REFERRAL = "referral",
  IDENTITY_DOCUMENT = "identity_document",
  CONSENT_DOCUMENT = "consent_document",
  OTHER = "other",
}

export enum AttachmentStatus {
  PENDING = "pending",
  AVAILABLE = "available",
  QUARANTINED = "quarantined",
  REJECTED = "rejected",
  DELETED = "deleted",
}

export enum ScanStatus {
  NOT_REQUIRED = "not_required",
  PENDING = "pending",
  CLEAN = "clean",
  SUSPICIOUS = "suspicious",
  INFECTED = "infected",
  FAILED = "failed",
}

export interface AttachmentActions {
  can_download: boolean;
  can_delete: boolean;
  can_restore: boolean;
  can_view_audit: boolean;
}

export interface Attachment {
  id: string;
  consultation_id: string;
  uploader_name: string;
  original_filename: string;
  safe_display_name: string;
  category: AttachmentCategory;
  category_label: string;
  description: string;
  size_bytes: number;
  detected_mime_type: string;
  status: AttachmentStatus;
  status_label: string;
  scan_status: ScanStatus;
  scan_status_label: string;
  created_at: string;
  updated_at: string;
  actions: AttachmentActions;
}

export interface AttachmentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Attachment[];
}
