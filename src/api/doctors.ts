import client from "./client";
import {
  DoctorDashboardData,
  DoctorDetail,
  DoctorListItem,
  DoctorProfile,
  DoctorProfileUpdateInput,
  DoctorSearchFilters,
  PaginatedResponse,
  Specialty,
} from "../types";

export const doctorsApi = {
  list: async (params?: DoctorSearchFilters) => {
    const { data } = await client.get<PaginatedResponse<DoctorListItem>>(
      "/doctors/",
      { params }
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<DoctorDetail>(`/doctors/${id}/`);
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
