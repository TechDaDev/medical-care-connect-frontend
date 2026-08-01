import client from "./client";
import {
  Consultation, PaginatedResponse, PatientConsultationDetail,
  PatientConsultationListItem, DoctorConsultationDetail,
  DoctorConsultationQueueItem, DoctorIntakeDetail,
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

export interface DoctorConsultationFilters {
  status?: string;
  status_group?: string;
  priority?: string;
  patient?: string;
  specialty?: string;
  needs_doctor_action?: boolean;
  has_unread_messages?: boolean;
  has_completed_intake?: boolean;
  has_medical_record?: boolean;
  created_after?: string;
  created_before?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface DoctorTransitionInput {
  action: string;
  reason?: string;
  target_doctor_id?: string;
  expected_status: string;
  expected_updated_at?: string;
  client_request_id: string;
  outcome?: string;
  medical_record_id?: string;
  confirmation?: boolean;
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

  listDoctor: async (params: DoctorConsultationFilters) => {
    const { data } = await client.get<PaginatedResponse<DoctorConsultationQueueItem>>(
      "/consultations/doctor/", { params }
    );
    return data;
  },

  getDoctorById: async (id: string) => {
    const { data } = await client.get<DoctorConsultationDetail>(
      `/consultations/${id}/doctor/`
    );
    return data;
  },

  getDoctorIntake: async (id: string) => {
    const { data } = await client.get<DoctorIntakeDetail>(
      `/consultations/${id}/doctor-intake/`
    );
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

  accept: async (id: string, expectedStatus = "submitted", expectedUpdatedAt?: string) => {
    const { data } = await client.post<DoctorConsultationDetail>(
      `/consultations/${id}/accept/`, {
        expected_status: expectedStatus,
        expected_updated_at: expectedUpdatedAt,
        client_request_id: crypto.randomUUID(),
      }
    );
    return data;
  },

  transitionDoctor: async (id: string, payload: DoctorTransitionInput) => {
    const { data } = await client.post<DoctorConsultationDetail>(
      `/consultations/${id}/doctor-transition/`, payload
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
