import client from "./client";
import { DoctorPublicProfile, PaginatedResponse, Specialty, DoctorProfile, DoctorProfileUpdateInput, DoctorDashboardData } from "../types";

export const doctorsApi = {
  list: async (params?: {
    search?: string;
    specialty?: string;
    accepting?: boolean;
    language?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }) => {
    const { data } = await client.get<PaginatedResponse<DoctorPublicProfile>>(
      "/doctors/",
      { params }
    );
    return data;
  },

  /** Normalized list — always returns an array regardless of API shape. */
  listNormalized: async (params?: {
    search?: string;
    specialty?: string;
    accepting?: boolean;
    language?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }) => {
    const raw = await doctorsApi.list(params);
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.results)) return raw.results;
    return [];
  },

  getById: async (id: string) => {
    const { data } = await client.get<DoctorPublicProfile>(`/doctors/${id}/`);
    return data;
  },

  getProfile: async () => {
    const { data } = await client.get<DoctorProfile>("/doctors/me/");
    return data;
  },

  updateProfile: async (payload: DoctorProfileUpdateInput) => {
    const { data } = await client.patch<DoctorProfile>("/doctors/me/", payload);
    return data;
  },

  getDashboard: async () => {
    const { data } = await client.get<DoctorDashboardData>("/doctors/me/dashboard/");
    return data;
  },

  toggleAccepting: async (accepting: boolean) => {
    const { data } = await client.patch<{ is_accepting_consultations: boolean }>(
      "/doctors/me/availability-status/",
      { is_accepting_consultations: accepting }
    );
    return data;
  },
};

export const specialtiesApi = {
  list: async () => {
    const { data } = await client.get<PaginatedResponse<Specialty> | Specialty[]>("/specialties/");
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  },
};
