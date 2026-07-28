import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import client from "../api/client";
import { consultationsApi } from "../api/consultations";
import { intakeApi } from "../api/intake";
import { messagesApi } from "../api/messages";
import { ConsultationTimeline } from "../components/consultations/ConsultationTimeline";
import { I18nProvider } from "../i18n";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";
import en from "../locales/en.json";

vi.mock("../api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const get = vi.mocked(client.get);
const post = vi.mocked(client.post);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("mcc_lang", "en");
});
afterEach(cleanup);

describe("Patient Phase C contracts", () => {
  it("sends complete server-side consultation filters", async () => {
    const filters = {
      status_group: "needs_action" as const,
      search: "doctor",
      has_unread_messages: true,
      created_after: "2026-07-01",
      ordering: "-updated_at",
      page: 2,
      page_size: 20,
    };
    get.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });
    await consultationsApi.listPatient(filters);
    expect(get).toHaveBeenCalledWith("/consultations/", { params: filters });
  });

  it("sends expected status for conflict-safe cancellation", async () => {
    post.mockResolvedValueOnce({ data: { id: "consultation-id" } });
    await consultationsApi.cancel(
      "consultation-id", "Reason long enough", "submitted",
    );
    expect(post).toHaveBeenCalledWith(
      "/consultations/consultation-id/cancel/",
      { reason: "Reason long enough", expected_status: "submitted" },
    );
  });

  it("sends idempotency keys for messages and intake answers", async () => {
    post.mockResolvedValue({ data: {} });
    await messagesApi.send("consultation-id", "message", "message-request-id");
    await intakeApi.answer("session-id", "answer", "answer-request-id");
    expect(post).toHaveBeenCalledWith(
      "/messaging/consultation-id/messages/",
      { content: "message", client_request_id: "message-request-id" },
    );
    expect(post).toHaveBeenCalledWith(
      "/intake/sessions/session-id/answer/",
      { answer: "answer", client_request_id: "answer-request-id" },
    );
  });

  it("renders server timeline semantics without computing transitions", () => {
    render(
      <I18nProvider>
        <ConsultationTimeline items={[
          {
            key: "submitted", status: "completed",
            occurred_at: "2026-07-28T10:00:00Z",
            title_key: "consultation.timeline.submitted.title",
            description_key: "consultation.timeline.submitted.description",
          },
          {
            key: "emergency_escalated", status: "terminal",
            occurred_at: "2026-07-28T10:05:00Z",
            title_key: "consultation.timeline.emergency_escalated.title",
            description_key: "consultation.timeline.emergency_escalated.description",
          },
        ]} />
      </I18nProvider>,
    );
    expect(screen.getByRole("list", { name: "Consultation Timeline" })).toBeInTheDocument();
    expect(screen.getByText("Emergency escalation")).toBeInTheDocument();
  });

  it("contains Phase C keys in English, Arabic, and Kurdish", () => {
    for (const dictionary of [en, ar, ckb] as Array<Record<string, string>>) {
      for (const key of [
        "phaseC.tab.needsAction",
        "phaseC.timeline",
        "phaseC.error.consultation_state_changed",
        "consultation.timeline.emergency_escalated.title",
        "record.field.chiefComplaint",
      ]) {
        expect(dictionary[key], `${key} missing`).toBeTruthy();
        expect(dictionary[key]).not.toBe(key);
      }
    }
  });
});
