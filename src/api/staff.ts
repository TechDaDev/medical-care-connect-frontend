import client from "./client";
import {
  PaginatedResponse,
} from "../types";
import {
  StaffDashboard,
  DoctorWorkload,
  StaffConsultation,
  TransferRequest,
  PriorityUpdate,
} from "../types/staff";

export const staffApi = {
  dashboard: async () => {
    const { data } = await client.get<StaffDashboard>("/staff/dashboard/");
    return data;
  },

  consultations: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    priority?: string;
    specialty?: string;
    doctor?: string;
    patient?: string;
    created_after?: string;
    created_before?: string;
    search?: string;
  }) => {
    const { data } = await client.get<PaginatedResponse<StaffConsultation>>(
      "/staff/consultations/",
      { params }
    );
    return data;
  },

  transfer: async (id: string, payload: TransferRequest) => {
    const { data } = await client.post(
      `/staff/consultations/${id}/transfer/`,
      payload
    );
    return data;
  },

  updatePriority: async (id: string, payload: PriorityUpdate) => {
    const { data } = await client.patch(
      `/staff/consultations/${id}/priority/`,
      payload
    );
    return data;
  },

  doctorWorkload: async (params?: {
    specialty?: string;
    accepting?: boolean;
    approved?: boolean;
    search?: string;
  }) => {
    const { data } = await client.get<DoctorWorkload[]>(
      "/staff/doctors/workload/",
      { params }
    );
    return data;
  },
};
