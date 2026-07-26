import client from "./client";
import type { PaginatedResponse } from "../types";
import type {
  AdminSpecialtyDetail,
  AdminSpecialtyFilters,
  AdminSpecialtyListItem,
  AdminSpecialtyWriteInput,
} from "../types/adminPhaseE";

export const specialtiesAdminApi = {
  list: async (params?: AdminSpecialtyFilters) => {
    const { data } = await client.get<PaginatedResponse<AdminSpecialtyListItem>>(
      "/staff/specialties/",
      { params },
    );
    return data;
  },
  detail: async (id: string) => {
    const { data } = await client.get<AdminSpecialtyDetail>(
      `/staff/specialties/${id}/`,
    );
    return data;
  },
  create: async (payload: AdminSpecialtyWriteInput) => {
    const { data } = await client.post<AdminSpecialtyDetail>(
      "/staff/specialties/",
      payload,
    );
    return data;
  },
  update: async (id: string, payload: Partial<AdminSpecialtyWriteInput>) => {
    const { data } = await client.patch<AdminSpecialtyDetail>(
      `/staff/specialties/${id}/`,
      payload,
    );
    return data;
  },
  activate: async (id: string) => {
    const { data } = await client.post<AdminSpecialtyDetail>(
      `/staff/specialties/${id}/activate/`,
      {},
    );
    return data;
  },
  deactivate: async (id: string) => {
    const { data } = await client.post<AdminSpecialtyDetail>(
      `/staff/specialties/${id}/deactivate/`,
      {},
    );
    return data;
  },
  reorder: async (items: Array<{ id: string; display_order: number }>) => {
    const { data } = await client.post<AdminSpecialtyListItem[]>(
      "/staff/specialties/reorder/",
      { items },
    );
    return data;
  },
};
