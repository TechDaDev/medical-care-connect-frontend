import client from "./client";
import { DoctorPublicProfile, PaginatedResponse, Specialty, DoctorProfile, DoctorDashboardData } from "../types";

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

  getById: async (id: string) => {
    const { data } = await client.get<DoctorPublicProfile>(`/doctors/${id}/`);
    return data;
  },

  getProfile: async () => {
    const { data } = await client.get<DoctorProfile>("/doctors/me/");
    return data;
  },

  updateProfile: async (payload: Partial<DoctorProfile>) => {
    const { data } = await client.patch<DoctorProfile>("/doctors/me/", payload);
    return data;
  },

  getDashboard: async () => {
    const { data } = await client.get<DoctorDashboardData>("/doctors/me/dashboard/");
    return data;
  },

  toggleAccepting: async (accepting: boolean) => {
    const { data } = await client.patch<DoctorProfile>("/doctors/me/", {
      is_accepting_consultations: accepting,
    });
    return data;
  },
};

export const specialtiesApi = {
  list: async () => {
    const { data } = await client.get<Specialty[]>("/specialties/");
    return data;
  },
};
