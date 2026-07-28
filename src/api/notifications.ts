import client from "./client";
import { Notification, NotificationUnreadCount, PaginatedResponse } from "../types";

export const notificationsApi = {
  list: async (params: Record<string, string | number | undefined> = {}) => {
    const { data } = await client.get<PaginatedResponse<Notification>>("/notifications/", {
      params,
    });
    return data;
  },

  markRead: async (id: string) => {
    const { data } = await client.post<Notification>(
      `/notifications/${id}/read/`,
    );
    return data;
  },

  markAllRead: async () => {
    const { data } = await client.post<{ marked_read: number }>(
      "/notifications/read-all/"
    );
    return data;
  },

  unreadCount: async () => {
    const { data } = await client.get<NotificationUnreadCount>(
      "/notifications/unread-count/"
    );
    return data;
  },
};
