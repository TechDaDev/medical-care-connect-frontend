import client from "./client";
import type { PaginatedResponse } from "../types";
import type {
  AdminAttachmentDetail,
  AdminAttachmentFilters,
  AdminAttachmentListItem,
  AttachmentAdminActionInput,
} from "../types/adminPhaseE";

function safeDownloadName(value: string): string {
  return value.replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "attachment";
}

export const attachmentsAdminApi = {
  list: async (params?: AdminAttachmentFilters) => {
    const { data } = await client.get<PaginatedResponse<AdminAttachmentListItem>>(
      "/staff/attachments/",
      { params },
    );
    return data;
  },
  detail: async (id: string) => {
    const { data } = await client.get<AdminAttachmentDetail>(
      `/staff/attachments/${id}/`,
    );
    return data;
  },
  rescan: async (id: string, payload: AttachmentAdminActionInput) => {
    const { data } = await client.post<AdminAttachmentDetail>(
      `/staff/attachments/${id}/rescan/`,
      payload,
    );
    return data;
  },
  reject: async (id: string, payload: AttachmentAdminActionInput) => {
    const { data } = await client.post<AdminAttachmentDetail>(
      `/staff/attachments/${id}/reject/`,
      payload,
    );
    return data;
  },
  release: async (id: string, payload: AttachmentAdminActionInput) => {
    const { data } = await client.post<AdminAttachmentDetail>(
      `/staff/attachments/${id}/release/`,
      payload,
    );
    return data;
  },
  retentionDelete: async (id: string, payload: AttachmentAdminActionInput) => {
    const { data } = await client.post<AdminAttachmentDetail>(
      `/staff/attachments/${id}/delete/`,
      payload,
    );
    return data;
  },
  download: async (id: string, fallbackName: string) => {
    const response = await client.get<Blob>(
      `/staff/attachments/${id}/download/`,
      { responseType: "blob" },
    );
    const match = response.headers["content-disposition"]?.match(
      /filename\*?=(?:UTF-8''|")?([^";]+)/i,
    );
    const encoded = match?.[1] || fallbackName;
    let decoded = fallbackName;
    try {
      decoded = decodeURIComponent(encoded.replace(/^"|"$/g, ""));
    } catch {
      // Keep safe fallback.
    }
    return { blob: response.data, filename: safeDownloadName(decoded) };
  },
};
