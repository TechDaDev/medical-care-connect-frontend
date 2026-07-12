import client from "./client";
import { AIIntakeSession } from "../types";

export const intakeApi = {
  start: async (consultationId: string, language = "en") => {
    const { data } = await client.post<AIIntakeSession>(
      `/consultations/${consultationId}/intake/start/`,
      { language }
    );
    return data;
  },

  answer: async (sessionId: string, answer: string) => {
    const { data } = await client.post<AIIntakeSession>(
      `/intake/sessions/${sessionId}/answer/`,
      { answer }
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
