import client from "./client";
import { PaginatedResponse } from "../types";
import {
  AuditEventListItem,
  AuditEventDetail,
  AuditEventFilters,
} from "../types/staff";

export const auditApi = {
  events: async (params?: AuditEventFilters) => {
    const { data } = await client.get<PaginatedResponse<AuditEventListItem>>(
      "/staff/audit-events/",
      { params }
    );
    return data;
  },

  eventDetail: async (eventId: string) => {
    const { data } = await client.get<AuditEventDetail>(
      `/staff/audit-events/${eventId}/`
    );
    return data;
  },

  exportCsv: async (params?: AuditEventFilters) => {
    const response = await client.get("/staff/audit-events/export.csv", {
      params,
      responseType: "blob",
    });
    return response;
  },
};
