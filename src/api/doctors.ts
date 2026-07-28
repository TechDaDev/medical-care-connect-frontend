import client from "./client";
import {
  DoctorDashboardData,
  DoctorAccessState,
  DoctorAcceptingStatusResponse,
  DoctorAvailabilityData,
  DoctorAvailabilityInput,
  DoctorAvailabilitySlot,
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

  getAccessState: async () => {
    const { data } = await client.get<DoctorAccessState>("/doctors/me/access-state/");
    return data;
  },

  getAvailability: async () => {
    const { data } = await client.get<DoctorAvailabilityData>("/doctors/me/availability/");
    return data;
  },

  createAvailability: async (payload: DoctorAvailabilityInput) => {
    const { data } = await client.post<DoctorAvailabilitySlot>("/doctors/me/availability/", payload);
    return data;
  },

  updateAvailability: async (id: string, payload: DoctorAvailabilityInput) => {
    const { data } = await client.patch<DoctorAvailabilitySlot>(
      `/doctors/me/availability/${id}/`,
      payload
    );
    return data;
  },

  deleteAvailability: async (id: string, expectedUpdatedAt?: string) => {
    await client.delete(`/doctors/me/availability/${id}/`, {
      params: expectedUpdatedAt ? { expected_updated_at: expectedUpdatedAt } : undefined,
    });
  },

  toggleAccepting: async (accepting: boolean, expectedUpdatedAt?: string) => {
    const { data } = await client.patch<DoctorAcceptingStatusResponse>(
      "/doctors/me/availability-status/",
      {
        is_accepting_consultations: accepting,
        ...(expectedUpdatedAt ? { expected_updated_at: expectedUpdatedAt } : {}),
      }
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
