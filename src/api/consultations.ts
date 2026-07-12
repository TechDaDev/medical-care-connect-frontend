import client from "./client";
import { Consultation, PaginatedResponse } from "../types";

export const consultationsApi = {
  list: async (params?: { page?: number; status?: string }) => {
    const { data } = await client.get<PaginatedResponse<Consultation>>(
      "/consultations/",
      { params }
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<Consultation>(`/consultations/${id}/`);
    return data;
  },

  create: async (payload: {
    doctor_id: string;
    chief_complaint: string;
    patient_note?: string;
  }) => {
    const { data } = await client.post<Consultation>(
      "/consultations/",
      payload
    );
    return data;
  },

  accept: async (id: string) => {
    const { data } = await client.post<Consultation>(
      `/consultations/${id}/accept/`
    );
    return data;
  },

  cancel: async (id: string, reason: string) => {
    const { data } = await client.post<Consultation>(
      `/consultations/${id}/cancel/`,
      { cancellation_reason: reason }
    );
    return data;
  },
};
