import client from "./client";
import { PaginatedResponse } from "../types";
import {
  PrivacyDeletionListItem,
  PrivacyDeletionDetail,
  PrivacyDeletionFilters,
  PrivacyDeletionReviewInput,
} from "../types/staff";

export const privacyAdminApi = {
  deletionRequests: async (params?: PrivacyDeletionFilters) => {
    const { data } = await client.get<PaginatedResponse<PrivacyDeletionListItem>>(
      "/staff/privacy/deletion-requests/",
      { params }
    );
    return data;
  },

  deletionRequestDetail: async (requestId: string) => {
    const { data } = await client.get<PrivacyDeletionDetail>(
      `/staff/privacy/deletion-requests/${requestId}/`
    );
    return data;
  },

  reviewDeletionRequest: async (requestId: string, payload: PrivacyDeletionReviewInput) => {
    const { data } = await client.post<PrivacyDeletionDetail>(
      `/staff/privacy/deletion-requests/${requestId}/review/`,
      payload
    );
    return data;
  },
};
