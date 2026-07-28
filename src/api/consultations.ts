import client from "./client";
import { Consultation, PaginatedResponse } from "../types";

export interface CreateConsultationInput {
  doctor: string;
  description: string;
  client_request_id: string;
  expected_doctor_updated_at?: string;
}

export interface CreatedConsultation {
  id: string;
  status: string;
  submitted_at: string;
  created_at: string;
  doctor: { id: string; full_name: string };
  specialty: { id: string; name: string };
  next_path: string;
}

export const consultationsApi = {
  list: async (params?: { page?: number; status?: string }) => {
    const { data } = await client.get<Consultation[] | PaginatedResponse<Consultation>>(
      "/consultations/",
      { params }
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<Consultation>(`/consultations/${id}/`);
    return data;
  },

  create: async (payload: CreateConsultationInput) => {
    const { data } = await client.post<CreatedConsultation>(
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
