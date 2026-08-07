import client from "./client";
import {
  AIIntakeSession,
  IntakeAnswerResponse,
  IntakeReview,
} from "../types";

interface StartIntakeResponse {
  session_id: string;
  session_status: string;
  current_question: string;
  question_count: number;
  emergency_detected: boolean;
  emergency_level: string;
  language: string;
}

interface ConfirmResponse {
  session_status: string;
  confirmed_at: string | null;
  can_submit_to_doctor: boolean;
  replayed: boolean;
}

interface SubmitResponse {
  session_status: string;
  submitted_at: string | null;
  consultation_status: string;
  replayed: boolean;
}

export const intakeApi = {
  start: async (consultationId: string, language = "en") => {
    const { data } = await client.post<StartIntakeResponse>(
      `/consultations/${consultationId}/intake/start/`,
      { language }
    );
    return data;
  },

  answer: async (sessionId: string, answer: string, clientRequestId: string) => {
    const { data } = await client.post<IntakeAnswerResponse>(
      `/intake/sessions/${sessionId}/answer/`,
      { answer, client_request_id: clientRequestId }
    );
    return data;
  },

  getSession: async (sessionId: string) => {
    const { data } = await client.get<AIIntakeSession>(
      `/intake/sessions/${sessionId}/`
    );
    return data;
  },

  review: async (sessionId: string) => {
    const { data } = await client.get<IntakeReview>(
      `/intake/sessions/${sessionId}/review/`
    );
    return data;
  },

  corrections: async (
    sessionId: string,
    corrections: Record<string, { value?: unknown; status?: string }>,
    expectedUpdatedAt: string,
    clientRequestId: string
  ) => {
    const { data } = await client.patch<IntakeReview>(
      `/intake/sessions/${sessionId}/corrections/`,
      {
        expected_updated_at: expectedUpdatedAt,
        corrections,
        client_request_id: clientRequestId,
      }
    );
    return data;
  },

  confirm: async (
    sessionId: string,
    expectedUpdatedAt: string,
    clientRequestId: string
  ) => {
    const { data } = await client.post<ConfirmResponse>(
      `/intake/sessions/${sessionId}/confirm/`,
      {
        expected_updated_at: expectedUpdatedAt,
        confirmation: true,
        client_request_id: clientRequestId,
      }
    );
    return data;
  },

  submit: async (
    sessionId: string,
    expectedUpdatedAt: string,
    clientRequestId: string
  ) => {
    const { data } = await client.post<SubmitResponse>(
      `/intake/sessions/${sessionId}/submit/`,
      {
        expected_updated_at: expectedUpdatedAt,
        client_request_id: clientRequestId,
      }
    );
    return data;
  },
};
