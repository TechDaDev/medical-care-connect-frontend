import client from "./client";
import { DoctorPublicProfile, PaginatedResponse, Specialty } from "../types";

export const doctorsApi = {
  list: async (params?: {
    search?: string;
    specialty?: string;
    accepting?: boolean;
    language?: string;
    ordering?: string;
    page?: number;
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
};

export const specialtiesApi = {
  list: async () => {
    const { data } = await client.get<Specialty[]>("/specialties/");
    return data;
  },
};
