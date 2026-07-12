import client from "./client";
import { Notification, NotificationUnreadCount } from "../types";

export const notificationsApi = {
  list: async (unreadOnly = false) => {
    const { data } = await client.get<Notification[]>("/notifications/", {
      params: unreadOnly ? { unread: "true" } : undefined,
    });
    return data;
  },

  markAllRead: async () => {
    const { data } = await client.post<{ marked_read: number }>(
      "/notifications/read/"
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
