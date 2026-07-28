import client from "./client";
import {
  Consultation, PaginatedResponse, PatientConsultationDetail,
  PatientConsultationListItem,
} from "../types";

export interface PatientConsultationFilters {
  status?: string;
  status_group?: "active" | "needs_action" | "completed" | "cancelled";
  doctor?: string;
  specialty?: string;
  needs_patient_action?: boolean;
  has_unread_messages?: boolean;
  created_after?: string;
  created_before?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

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

  listPatient: async (params: PatientConsultationFilters) => {
    const { data } = await client.get<PaginatedResponse<PatientConsultationListItem>>(
      "/consultations/", { params }
    );
    return data;
  },

  getPatientById: async (id: string) => {
    const { data } = await client.get<PatientConsultationDetail>(
      `/consultations/${id}/`
    );
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

  cancel: async (id: string, reason: string, expectedStatus: string) => {
    const { data } = await client.post<PatientConsultationDetail>(
      `/consultations/${id}/cancel/`,
      { reason, expected_status: expectedStatus }
    );
    return data;
  },
};
