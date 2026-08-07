import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { intakeApi } from "../api/intake";
import { IntakePage } from "../pages/patient/IntakePage";
import { I18nProvider } from "../i18n";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";
import en from "../locales/en.json";

vi.mock("../api/intake", () => ({
  intakeApi: {
    start: vi.fn(),
    answer: vi.fn(),
    getSession: vi.fn(),
    review: vi.fn(),
    corrections: vi.fn(),
    confirm: vi.fn(),
    submit: vi.fn(),
  },
}));

const start = vi.mocked(intakeApi.start);
const answer = vi.mocked(intakeApi.answer);
const getSession = vi.mocked(intakeApi.getSession);
const review = vi.mocked(intakeApi.review);
const corrections = vi.mocked(intakeApi.corrections);

const SESSION = {
  id: "session-1",
  consultation: "consultation-1",
  status: "in_progress",
  language: "en",
  current_question: "What brings you in today?",
  question_count: 1,
  answered_count: 1,
  is_complete: false,
  ready_for_review: false,
  can_send_message: true,
  can_complete: false,
  can_confirm: false,
  can_submit: false,
  emergency_detected: false,
  emergency_level: "none",
  emergency_instruction: "",
  started_at: "2026-08-07T10:00:00Z",
  completed_at: null,
  confirmed_at: null,
  submitted_at: null,
  updated_at: "2026-08-07T10:05:00Z",
  messages: [
    { id: "m1", role: "assistant", content: "What brings you in today?", sequence_number: 1, created_at: "2026-08-07T10:00:00Z" },
  ],
  progress_percent: 8,
  missing_blocking_fields: ["duration"],
};

const REVIEW = {
  session_id: "session-1",
  session_status: "awaiting_patient_review",
  consultation_id: "consultation-1",
  review: {
    sections: {
      chief_complaint: {
        value: "headache", status: "answered", source: "intake_extraction",
        evidence_message_ids: ["m1"], confirmed_by_patient: false,
      },
      duration: {
        value: null, status: "missing", source: "",
        evidence_message_ids: [], confirmed_by_patient: false,
      },
    },
    ai_generated_summary: "Synthetic summary",
    generated_at: "2026-08-07T10:05:00Z",
    prompt_version: "mcc-intake-v2",
    schema_version: "mcc-intake-v2",
  },
  can_confirm: true,
  can_correct: true,
  can_submit: false,
  updated_at: "2026-08-07T10:05:00Z",
  missing_blocking_fields: ["duration"],
};

function reviewSession() {
  return { ...SESSION, status: "awaiting_patient_review", ready_for_review: true, can_confirm: true };
}

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/patient/consultations/consultation-1/intake"]}>
          <Routes>
            <Route
              path="/app/patient/consultations/:consultationId/intake"
              element={<IntakePage />}
            />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
}

async function beginIntake() {
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Start intake" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("mcc_lang", "en");
  start.mockResolvedValue({
    session_id: "session-1",
    session_status: "in_progress",
    current_question: "What brings you in today?",
    question_count: 1,
    emergency_detected: false,
    emergency_level: "none",
    language: "en",
  });
});
afterEach(cleanup);

describe("AI intake introduction", () => {
  it("shows the automated-assistant disclosure before starting", () => {
    renderPage();
    expect(screen.getByText("Automated health intake")).toBeInTheDocument();
    expect(screen.getByText(/automated intake assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/not a doctor/i)).toBeInTheDocument();
    expect(screen.getByText(/not an emergency service/i)).toBeInTheDocument();
    expect(screen.getByText(/shared with your assigned doctor/i)).toBeInTheDocument();
    expect(screen.getByText(/review and correct/i)).toBeInTheDocument();
  });

  it("starts intake when the start action is pressed", async () => {
    getSession.mockResolvedValue(SESSION);
    await beginIntake();
    await waitFor(() => expect(start).toHaveBeenCalledWith("consultation-1", "en"));
  });
});

describe("AI intake conversation", () => {
  it("loads the session and shows the assistant question", async () => {
    getSession.mockResolvedValue(SESSION);
    await beginIntake();
    await waitFor(() =>
      expect(screen.getByText("What brings you in today?")).toBeInTheDocument()
    );
  });

  it("sends the answer with an idempotency key", async () => {
    getSession.mockResolvedValue(SESSION);
    answer.mockResolvedValue({
      session_status: "in_progress", patient_facing_message: "ok", next_question: null,
      question_count: 2, emergency_detected: false, emergency_level: "none", record_ready: false,
    });
    await beginIntake();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Type your answer…")).toBeInTheDocument()
    );
    fireEvent.change(screen.getByPlaceholderText("Type your answer…"), {
      target: { value: "I have a headache" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(answer).toHaveBeenCalledWith(
        "session-1", "I have a headache", expect.any(String)
      );
    });
  });

  it("does not double-submit while a turn is pending", async () => {
    getSession.mockResolvedValue(SESSION);
    answer.mockReturnValue(new Promise(() => {})); // never resolves
    await beginIntake();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Type your answer…")).toBeInTheDocument()
    );
    fireEvent.change(screen.getByPlaceholderText("Type your answer…"), {
      target: { value: "headache" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    );
  });

  it("offers I-don't-know and prefer-not-to-answer actions", async () => {
    getSession.mockResolvedValue(SESSION);
    answer.mockResolvedValue({
      session_status: "in_progress", patient_facing_message: "ok", next_question: null,
      question_count: 2, emergency_detected: false, emergency_level: "none", record_ready: false,
    });
    await beginIntake();
    await waitFor(() =>
      expect(screen.getByText("I don't know")).toBeInTheDocument()
    );
    expect(screen.getByText("Prefer not to answer")).toBeInTheDocument();
  });
});

describe("AI intake review and confirmation", () => {
  it("shows structured sections and AI disclaimer, blocking confirmation while required data is missing", async () => {
    getSession.mockResolvedValue(reviewSession());
    review.mockResolvedValue(REVIEW);
    await beginIntake();
    await waitFor(() =>
      expect(screen.getByText("Review your information")).toBeInTheDocument()
    );
    await waitFor(() => expect(screen.getByText("Main concern")).toBeInTheDocument());
    expect(screen.getByText("AI-assisted summary")).toBeInTheDocument();
    expect(screen.getByText("Not clinically verified.")).toBeInTheDocument();
    expect(screen.getByText(/Required information still missing/)).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: "Confirm information" });
    expect(confirmButton).toBeDisabled();
  });

  it("allows editing an extracted value", async () => {
    getSession.mockResolvedValue(reviewSession());
    review.mockResolvedValue(REVIEW);
    corrections.mockResolvedValue(REVIEW);
    await beginIntake();
    await waitFor(() =>
      expect(screen.getByText("Review your information")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Edit" }).length).toBeGreaterThan(0)
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.change(screen.getByLabelText("Corrected value"), {
      target: { value: "migraine" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save correction" }));
    await waitFor(() =>
      expect(corrections).toHaveBeenCalledWith(
        "session-1",
        { chief_complaint: { value: "migraine", status: "answered" } },
        expect.any(String),
        expect.any(String)
      )
    );
  });
});

describe("AI intake emergency state", () => {
  it("shows emergency guidance and blocks normal flow", async () => {
    getSession.mockResolvedValue({
      ...SESSION, status: "emergency_stopped", emergency_detected: true, can_send_message: false,
    });
    await beginIntake();
    await waitFor(() =>
      expect(screen.getByText("Urgent attention needed")).toBeInTheDocument()
    );
    expect(screen.getByText(/not an emergency service/i)).toBeInTheDocument();
  });
});

describe("Intake i18n", () => {
  it("contains Phase A keys in English, Arabic, and Kurdish", () => {
    const keys = [
      "intake.introAutomated",
      "intake.introNotDoctor",
      "intake.introNotEmergency",
      "intake.introSharedWithDoctor",
      "intake.reviewTitle",
      "intake.confirmInfo",
      "intake.submitToDoctor",
      "intake.emergencySeekCare",
      "intake.notClinicallyVerified",
      "intake.status.uncertain",
      "intake.fields.chief_complaint",
      "intake.fields.current_medications",
    ];
    for (const dictionary of [en, ar, ckb] as Array<Record<string, string>>) {
      for (const key of keys) {
        expect(dictionary[key], `${key} missing`).toBeTruthy();
        expect(dictionary[key]).not.toBe(key);
      }
    }
  });
});
