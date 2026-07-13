import { t } from "../../utils/i18n";
import { AttachmentCategory } from "../../types/attachments";

const CATEGORY_KEYS: Record<AttachmentCategory, string> = {
  [AttachmentCategory.MEDICAL_REPORT]: "attachment.category_medical_report",
  [AttachmentCategory.LABORATORY_RESULT]: "attachment.category_laboratory_result",
  [AttachmentCategory.MEDICAL_IMAGE]: "attachment.category_medical_image",
  [AttachmentCategory.REFERRAL]: "attachment.category_referral",
  [AttachmentCategory.IDENTITY_DOCUMENT]: "attachment.category_identity_document",
  [AttachmentCategory.CONSENT_DOCUMENT]: "attachment.category_consent_document",
  [AttachmentCategory.OTHER]: "attachment.category_other",
};

export function attachmentCategoryLabel(category: AttachmentCategory): string {
  return t(CATEGORY_KEYS[category] || "attachment.category_other");
}

export const ATTACHMENT_CATEGORIES = Object.values(AttachmentCategory).map((cat) => ({
  value: cat,
  label: attachmentCategoryLabel(cat),
}));
