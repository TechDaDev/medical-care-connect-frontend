import client from "./client";
import type {
  DoctorDataExport,
  DoctorDeletionRequest,
  DoctorMessageThread,
  DoctorPrivacyOverview,
  DoctorReviewItem,
  DoctorReviewPage,
  Notification,
  PaginatedResponse,
} from "../types";

type Filters = Record<string, string | number | boolean | undefined>;

export const doctorPhaseDApi = {
  messages: async (params?: Filters) => {
    const { data } = await client.get<PaginatedResponse<DoctorMessageThread>>("/doctors/me/message-threads/", { params });
    return data;
  },
  notifications: async (params?: Filters) => {
    const { data } = await client.get<PaginatedResponse<Notification> & { unread_count: number }>("/doctors/me/notifications/", { params });
    return data;
  },
  markNotificationRead: async (id: string) => {
    const { data } = await client.post<Notification>(`/doctors/me/notifications/${id}/read/`);
    return data;
  },
  markAllNotificationsRead: async () => {
    const { data } = await client.post<{ marked_read: number }>("/doctors/me/notifications/read-all/");
    return data;
  },
  reviews: async (params?: Filters) => {
    const { data } = await client.get<DoctorReviewPage>("/doctors/me/reviews/", { params });
    return data;
  },
  createReviewResponse: async (reviewId: string, body: string, clientRequestId: string) => {
    const { data } = await client.post<DoctorReviewItem>(`/doctors/me/reviews/${reviewId}/response/`, { body, client_request_id: clientRequestId });
    return data;
  },
  updateReviewResponse: async (reviewId: string, body: string, expectedUpdatedAt: string, clientRequestId: string) => {
    const { data } = await client.patch<DoctorReviewItem>(`/doctors/me/reviews/${reviewId}/response/`, {
      body, expected_updated_at: expectedUpdatedAt, client_request_id: clientRequestId,
    });
    return data;
  },
  privacy: async () => {
    const { data } = await client.get<DoctorPrivacyOverview>("/doctors/me/privacy/");
    return data;
  },
  exports: async (params?: Filters) => {
    const { data } = await client.get<PaginatedResponse<DoctorDataExport>>("/doctors/me/privacy/exports/", { params });
    return data;
  },
  requestExport: async () => {
    const { data } = await client.post<DoctorDataExport>("/doctors/me/privacy/exports/");
    return data;
  },
  downloadExport: async (id: string) => {
    const { data } = await client.get<Blob>(`/doctors/me/privacy/exports/${id}/download/`, { responseType: "blob" });
    return data;
  },
  deletions: async (params?: Filters) => {
    const { data } = await client.get<PaginatedResponse<DoctorDeletionRequest>>("/doctors/me/privacy/deletion/", { params });
    return data;
  },
  requestDeletion: async (reason: string) => {
    const { data } = await client.post<DoctorDeletionRequest>("/doctors/me/privacy/deletion/", { reason, confirmation: true });
    return data;
  },
  cancelDeletion: async (id: string) => {
    const { data } = await client.post<DoctorDeletionRequest>(`/doctors/me/privacy/deletion/${id}/cancel/`);
    return data;
  },
};
