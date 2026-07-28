import client from "./client";
import { AIIntakeSession } from "../types";

interface StartIntakeResponse {
  session_id: string;
  session_status: string;
  current_question: string;
  question_count: number;
  emergency_detected: boolean;
  emergency_level: string;
  language: string;
}

interface IntakeAnswerResponse {
  session_status: string;
  patient_facing_message: string;
  next_question: string | null;
  question_count: number;
  emergency_detected: boolean;
  emergency_level: string;
  record_ready: boolean;
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
};
