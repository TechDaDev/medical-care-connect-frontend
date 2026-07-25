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
  OperationsStatus,
  OperationsMetrics,
  DoctorApplicationListItem,
  DoctorApplicationDetail,
  DoctorApplicationReviewInput,
  DoctorApplicationFilters,
  AdminUserListItem,
  AdminUserDetail,
  AdminUserFilters,
  AdminUserStatusInput,
  AdminUserRoleInput,
  AdminUserSessionRevokeInput,
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

  operationsStatus: async () => {
    const { data } = await client.get<OperationsStatus>("/staff/operations/status/");
    return data;
  },

  operationsMetrics: async () => {
    const { data } = await client.get<OperationsMetrics>("/staff/operations/metrics/");
    return data;
  },

  // ── Doctor Applications ──

  doctorApplications: async (params?: DoctorApplicationFilters) => {
    const { data } = await client.get<PaginatedResponse<DoctorApplicationListItem>>(
      "/staff/doctors/applications/",
      { params }
    );
    return data;
  },

  doctorApplicationDetail: async (profileId: string) => {
    const { data } = await client.get<DoctorApplicationDetail>(
      `/staff/doctors/applications/${profileId}/`
    );
    return data;
  },

  reviewDoctorApplication: async (profileId: string, payload: DoctorApplicationReviewInput) => {
    const { data } = await client.post<DoctorApplicationDetail>(
      `/staff/doctors/applications/${profileId}/review/`,
      payload
    );
    return data;
  },

  downloadDoctorLicense: async (profileId: string) => {
    const response = await client.get(
      `/staff/doctors/applications/${profileId}/license/`,
      { responseType: "blob" }
    );
    return response;
  },

  // ── Admin User Management ──

  adminUsers: async (params?: AdminUserFilters) => {
    const { data } = await client.get<PaginatedResponse<AdminUserListItem>>(
      "/staff/users/",
      { params }
    );
    return data;
  },

  adminUserDetail: async (userId: string) => {
    const { data } = await client.get<AdminUserDetail>(
      `/staff/users/${userId}/`
    );
    return data;
  },

  updateAdminUserStatus: async (userId: string, payload: AdminUserStatusInput) => {
    const { data } = await client.patch(
      `/staff/users/${userId}/status/`,
      payload
    );
    return data;
  },

  revokeAdminUserSessions: async (userId: string, payload: AdminUserSessionRevokeInput) => {
    const { data } = await client.post(
      `/staff/users/${userId}/revoke-sessions/`,
      payload
    );
    return data;
  },

  updateAdminUserRole: async (userId: string, payload: AdminUserRoleInput) => {
    const { data } = await client.patch(
      `/staff/users/${userId}/role/`,
      payload
    );
    return data;
  },
};
