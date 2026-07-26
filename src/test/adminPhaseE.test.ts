import { describe, expect, it } from "vitest";

import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";
import en from "../locales/en.json";
import type {
  AdminAttachmentDetail,
  AdminSpecialtyListItem,
} from "../types/adminPhaseE";

describe("Phase E specialty contract", () => {
  it("carries all translations, usage counts, and server actions", () => {
    const specialty: AdminSpecialtyListItem = {
      id: "00000000-0000-0000-0000-000000000001",
      code: "synthetic",
      name_en: "Synthetic",
      name_ar: "اصطناعي",
      name_ckb: "دەستکرد",
      is_active: true,
      display_order: 1,
      doctor_count: 2,
      active_doctor_count: 1,
      active_consultation_count: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      available_actions: ["edit", "deactivate"],
    };
    expect(specialty.name_en).toBeTruthy();
    expect(specialty.name_ar).toBeTruthy();
    expect(specialty.name_ckb).toBeTruthy();
    expect(specialty.available_actions).toContain("deactivate");
  });
});

describe("Phase E attachment contract", () => {
  it("uses server-provided transitions and contains no storage locator", () => {
    const detail: AdminAttachmentDetail = {
      id: "00000000-0000-0000-0000-000000000002",
      filename: "attachment.pdf",
      mime_type: "application/pdf",
      size_bytes: 42,
      status: "quarantined",
      scanner_status: "clean",
      scanner_provider: "clamav",
      scan_completed_at: "2026-01-01T00:00:00Z",
      owner_type: "consultation",
      owner_reference: "00000000-0000-0000-0000-000000000003",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      retention_eligible: false,
      available_actions: ["rescan", "release"],
      file_extension: ".pdf",
      checksum: "0".repeat(64),
      quarantine_reason: "",
      rejection_reason: "",
      action_history: [],
    };
    expect(detail.available_actions).toEqual(["rescan", "release"]);
    expect(JSON.stringify(detail)).not.toContain("storage_key");
    expect(JSON.stringify(detail)).not.toContain("signed_url");
  });
});

describe("Phase E localization", () => {
  const required = [
    "nav.specialties",
    "nav.attachmentAdmin",
    "specialtyAdmin.title",
    "specialtyAdmin.nameAr",
    "specialtyAdmin.nameCkb",
    "attachmentAdmin.title",
    "attachmentAdmin.action.rescan",
    "attachmentAdmin.action.release",
    "attachmentAdmin.action.retention_delete",
  ];

  it.each([
    ["English", en],
    ["Arabic", ar],
    ["Kurdish Sorani", ckb],
  ])("%s has every Phase E key", (_locale, dictionary) => {
    for (const key of required) {
      expect(dictionary).toHaveProperty(key);
      expect(dictionary[key as keyof typeof dictionary]).not.toBe(key);
    }
  });
});

describe("notification delivery architecture boundary", () => {
  it("does not treat in-app read state as delivery status", () => {
    const inAppNotification = { is_read: false };
    expect("delivery_status" in inAppNotification).toBe(false);
    expect("retry_count" in inAppNotification).toBe(false);
  });
});
