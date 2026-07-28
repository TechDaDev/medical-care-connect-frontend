import client from "./client";
import {
  ConsultationMessage, DoctorInternalNote, PaginatedResponse, UnreadCount,
} from "../types";

export const messagesApi = {
  list: async (consultationId: string) => {
    const { data } = await client.get<PaginatedResponse<ConsultationMessage>>(
      `/messaging/${consultationId}/messages/`
    );
    return data;
  },

  send: async (consultationId: string, content: string, clientRequestId: string) => {
    const { data } = await client.post<ConsultationMessage>(
      `/messaging/${consultationId}/messages/`,
      { content, client_request_id: clientRequestId }
    );
    return data;
  },

  markRead: async (consultationId: string, messageIds: string[]) => {
    await client.post(`/messaging/${consultationId}/messages/read/`, {
      message_ids: messageIds,
    });
  },

  unreadCount: async (consultationId: string) => {
    const { data } = await client.get<{ unread_count: number }>(
      `/messaging/${consultationId}/messages/unread-count/`
    );
    return data;
  },

  allUnreadCounts: async () => {
    const { data } = await client.get<UnreadCount[]>(
      "/messaging/unread-counts/"
    );
    return data;
  },

  listInternalNotes: async (consultationId: string) => {
    const { data } = await client.get<DoctorInternalNote[]>(
      `/messaging/${consultationId}/internal-notes/`
    );
    return data;
  },

  createInternalNote: async (consultationId: string, content: string) => {
    const { data } = await client.post<DoctorInternalNote>(
      `/messaging/${consultationId}/internal-notes/`,
      { content }
    );
    return data;
  },
};
