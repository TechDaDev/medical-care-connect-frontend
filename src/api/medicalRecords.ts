import client from "./client";
import {
  MedicalRecordDraft,
  PaginatedResponse,
  PatientMedicalRecord,
  PatientMedicalRecordListItem,
  DoctorMedicalRecordDetail,
  DoctorMedicalRecordListItem,
  DoctorRecordListFilters,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  FinalizeMedicalRecordInput,
} from "../types";

export const medicalRecordsApi = {
  listDoctorMedicalRecords: async (params: DoctorRecordListFilters) => {
    const { data } = await client.get<PaginatedResponse<DoctorMedicalRecordListItem>>(
      "/doctors/me/medical-records/", { params },
    );
    return data;
  },

  getDoctorMedicalRecord: async (id: string) => {
    const { data } = await client.get<DoctorMedicalRecordDetail>(`/doctors/me/medical-records/${id}/`);
    return data;
  },

  getOrCreateConsultationMedicalRecord: async (consultationId: string, payload: CreateMedicalRecordInput) => {
    const { data } = await client.post<DoctorMedicalRecordDetail>(`/consultations/${consultationId}/medical-record/`, payload);
    return data;
  },

  updateDoctorMedicalRecord: async (id: string, payload: UpdateMedicalRecordInput) => {
    const { data } = await client.patch<DoctorMedicalRecordDetail>(`/doctors/me/medical-records/${id}/`, payload);
    return data;
  },

  finalizeDoctorMedicalRecord: async (id: string, payload: FinalizeMedicalRecordInput) => {
    const { data } = await client.post<DoctorMedicalRecordDetail>(`/doctors/me/medical-records/${id}/finalize/`, payload);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await client.get<MedicalRecordDraft>(
      `/medical-records/${id}/`
    );
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await client.patch<MedicalRecordDraft>(
      `/medical-records/${id}/`,
      payload
    );
    return data;
  },

  confirm: async (id: string, confirmed: boolean) => {
    const { data } = await client.post(`/medical-records/${id}/confirm/`, {
      confirmed,
    });
    return data;
  },

  listMine: async (params: Record<string, string | number | undefined>) => {
    const { data } = await client.get<PaginatedResponse<PatientMedicalRecordListItem>>(
      "/patients/me/medical-records/",
      { params },
    );
    return data;
  },

  getMine: async (id: string) => {
    const { data } = await client.get<PatientMedicalRecord>(
      `/patients/me/medical-records/${id}/`,
    );
    return data;
  },
};
