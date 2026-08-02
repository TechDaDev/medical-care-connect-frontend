import { beforeEach, describe, expect, it, vi } from "vitest";
import client from "../api/client";
import { doctorPhaseDApi } from "../api/doctorPhaseD";
import { buildNavigationItems } from "../components/layout/navigation";
import { UserRole } from "../types";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";

vi.mock("../api/client", () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const get = vi.mocked(client.get); const post = vi.mocked(client.post); const patch = vi.mocked(client.patch);

describe("Doctor Phase D API contracts", () => {
  beforeEach(() => vi.clearAllMocks());
  it("uses bounded doctor message and notification endpoints", async () => {
    get.mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } });
    await doctorPhaseDApi.messages({ unread_only: true, page_size: 20 });
    await doctorPhaseDApi.notifications({ unread: true, ordering: "-created_at" });
    expect(get).toHaveBeenNthCalledWith(1, "/doctors/me/message-threads/", { params: { unread_only: true, page_size: 20 } });
    expect(get).toHaveBeenNthCalledWith(2, "/doctors/me/notifications/", { params: { unread: true, ordering: "-created_at" } });
  });
  it("uses recipient-scoped batch notification writes", async () => {
    post.mockResolvedValue({ data: {} }); await doctorPhaseDApi.markNotificationRead("notice-id"); await doctorPhaseDApi.markAllNotificationsRead();
    expect(post).toHaveBeenNthCalledWith(1, "/doctors/me/notifications/notice-id/read/");
    expect(post).toHaveBeenNthCalledWith(2, "/doctors/me/notifications/read-all/");
  });
  it("sends review idempotency and stale-write fields", async () => {
    post.mockResolvedValue({ data: {} }); patch.mockResolvedValue({ data: {} });
    await doctorPhaseDApi.createReviewResponse("review-id", "Synthetic response", "request-id");
    await doctorPhaseDApi.updateReviewResponse("review-id", "Updated response", "timestamp", "update-id");
    expect(post).toHaveBeenCalledWith("/doctors/me/reviews/review-id/response/", { body: "Synthetic response", client_request_id: "request-id" });
    expect(patch).toHaveBeenCalledWith("/doctors/me/reviews/review-id/response/", { body: "Updated response", expected_updated_at: "timestamp", client_request_id: "update-id" });
  });
  it("keeps doctor privacy mutations on doctor-owned endpoints", async () => {
    post.mockResolvedValue({ data: {} }); get.mockResolvedValue({ data: new Blob() });
    await doctorPhaseDApi.requestExport(); await doctorPhaseDApi.requestDeletion("Synthetic bounded reason"); await doctorPhaseDApi.cancelDeletion("deletion-id"); await doctorPhaseDApi.downloadExport("export-id");
    expect(post).toHaveBeenCalledWith("/doctors/me/privacy/exports/");
    expect(post).toHaveBeenCalledWith("/doctors/me/privacy/deletion/", { reason: "Synthetic bounded reason", confirmation: true });
    expect(post).toHaveBeenCalledWith("/doctors/me/privacy/deletion/deletion-id/cancel/");
    expect(get).toHaveBeenCalledWith("/doctors/me/privacy/exports/export-id/download/", { responseType: "blob" });
  });
});

describe("Doctor Phase D navigation and locales", () => {
  it("closes doctor navigation in required order without changing patient or staff", () => {
    const t = (key: string) => key; const paths = buildNavigationItems(UserRole.DOCTOR, t).map(item => item.path);
    expect(paths).toEqual(["/app/doctor", "/app/doctor/consultations", "/app/doctor/messages", "/app/doctor/medical-records", "/app/doctor/reviews", "/app/doctor/availability", "/app/doctor/notifications", "/app/doctor/profile", "/app/doctor/privacy"]);
    expect(buildNavigationItems(UserRole.PATIENT, t).map(item => item.path)).not.toContain("/app/doctor/privacy");
    expect(buildNavigationItems(UserRole.ADMINISTRATOR, t).map(item => item.path)).not.toContain("/app/doctor/messages");
  });
  it("contains critical messages, notification, review, profile, and privacy keys in all locales", () => {
    for (const dictionary of [en, ar, ckb] as Array<Record<string, string>>) for (const key of ["doctorD.messages.tab.needs_reply", "doctorD.notifications.unsafe", "doctorD.reviews.anonymous", "doctorD.reviews.confidentialityWarning", "doctorD.profile.completeness", "doctorD.privacy.retentionClinical", "doctorD.deletion.confirm"]) expect(dictionary[key], `${key} missing`).toBeTruthy();
  });
});
