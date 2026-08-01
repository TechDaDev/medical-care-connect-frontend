import { beforeEach, describe, expect, it, vi } from "vitest";
import client from "../api/client";
import { consultationsApi } from "../api/consultations";
import { messagesApi } from "../api/messages";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";

vi.mock("../api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const get = vi.mocked(client.get);
const post = vi.mocked(client.post);

describe("Doctor Phase B API contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses isolated paginated doctor queue endpoint with server filters", async () => {
    const filters = { status_group: "needs_action", has_unread_messages: true, page: 2 };
    get.mockResolvedValueOnce({ data: { count: 0, next: null, previous: null, results: [] } });
    await consultationsApi.listDoctor(filters);
    expect(get).toHaveBeenCalledWith("/consultations/doctor/", { params: filters });
  });

  it("loads doctor-safe detail and intake contracts", async () => {
    get.mockResolvedValue({ data: {} });
    await consultationsApi.getDoctorById("consultation-id");
    await consultationsApi.getDoctorIntake("consultation-id");
    expect(get).toHaveBeenNthCalledWith(1, "/consultations/consultation-id/doctor/");
    expect(get).toHaveBeenNthCalledWith(2, "/consultations/consultation-id/doctor-intake/");
  });

  it("sends optimistic-lock and idempotency fields for workflow changes", async () => {
    post.mockResolvedValueOnce({ data: {} });
    await consultationsApi.transitionDoctor("consultation-id", {
      action: "request_patient_response",
      reason: "Synthetic clarification required",
      expected_status: "under_review",
      expected_updated_at: "2026-08-01T12:00:00Z",
      client_request_id: "9051fc42-e846-4b9a-80d4-de2ea06a3618",
    });
    expect(post).toHaveBeenCalledWith(
      "/consultations/consultation-id/doctor-transition/",
      expect.objectContaining({ expected_status: "under_review", client_request_id: expect.any(String) }),
    );
  });

  it("creates internal notes with a client request id and reads pagination", async () => {
    post.mockResolvedValueOnce({ data: {} });
    await messagesApi.createInternalNote("consultation-id", "Synthetic private note");
    expect(post).toHaveBeenCalledWith(
      "/messaging/consultation-id/internal-notes/",
      expect.objectContaining({ content: "Synthetic private note", client_request_id: expect.any(String) }),
    );
  });
});

describe("Doctor Phase B localization", () => {
  it("covers queue, workspace, safe note, and transition labels in all locales", () => {
    for (const dictionary of [en, ar, ckb] as Array<Record<string, string>>) {
      for (const key of [
        "doctorPhaseB.queueTitle", "doctorPhaseB.workspaceTitle",
        "doctorPhaseB.notesPrivate", "doctorPhaseB.emergencyWarning",
        "doctorPhaseB.action.request_patient_response", "doctorPhaseB.action.transfer",
      ]) expect(dictionary[key], `${key} missing`).toBeTruthy();
    }
  });
});
