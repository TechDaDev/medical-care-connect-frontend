import client from "./client";
import { Attachment, AttachmentListResponse } from "../types/attachments";
import { AxiosProgressEvent } from "axios";

export const attachmentsApi = {
  /** List consultation attachments */
  list: async (consultationId: string, page = 1, pageSize = 20) => {
    const { data } = await client.get<AttachmentListResponse>(
      `/consultations/${consultationId}/attachments/`,
      { params: { page, page_size: pageSize } },
    );
    return data;
  },

  /** Get single attachment metadata */
  get: async (attachmentId: string) => {
    const { data } = await client.get<Attachment>(`/attachments/${attachmentId}/`);
    return data;
  },

  /** Upload attachment with progress and cancellation support */
  upload: async (
    consultationId: string,
    file: File,
    category: string,
    description: string,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (description) formData.append("description", description);

    const { data } = await client.post<Attachment>(
      `/consultations/${consultationId}/attachments/upload/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        signal,
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      },
    );
    return data;
  },

  /** Download attachment as blob */
  download: async (attachmentId: string) => {
    const { data, headers } = await client.get<Blob>(
      `/attachments/${attachmentId}/download/`,
      { responseType: "blob" },
    );
    const disposition = headers["content-disposition"] || "";
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"'\n;]+)/);
    const filename = match ? decodeURIComponent(match[1]) : "download";
    return { blob: data, filename };
  },

  /** Soft-delete attachment */
  delete: async (attachmentId: string, reason?: string) => {
    await client.delete(`/attachments/${attachmentId}/delete/`, {
      data: reason ? { reason } : undefined,
    });
  },

  /** Restore soft-deleted attachment */
  restore: async (attachmentId: string) => {
    const { data } = await client.post<Attachment>(`/attachments/${attachmentId}/restore/`);
    return data;
  },
};
