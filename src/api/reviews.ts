import client from "./client";
import type { ConsultationReview, DoctorReputation, PaginatedResponse } from "../types";

export const reviewsApi = {
  // ── Patient ──

  getReview: async (consultationId: string) => {
    const { data } = await client.get<ConsultationReview>(
      `/reviews/consultations/${consultationId}/review/`
    );
    return data;
  },

  createReview: async (consultationId: string, payload: {
    rating: number;
    title?: string;
    body?: string;
    is_anonymous?: boolean;
  }) => {
    const { data } = await client.post<ConsultationReview>(
      `/reviews/consultations/${consultationId}/review/`,
      payload
    );
    return data;
  },

  updateReview: async (consultationId: string, payload: Partial<{
    rating: number;
    title: string;
    body: string;
    is_anonymous: boolean;
  }>) => {
    const { data } = await client.patch<ConsultationReview>(
      `/reviews/consultations/${consultationId}/review/edit/`,
      payload
    );
    return data;
  },

  deleteReview: async (consultationId: string) => {
    await client.delete(`/reviews/consultations/${consultationId}/review/edit/`);
  },

  // ── Doctor ──

  respondToReview: async (reviewId: string, body: string) => {
    const { data } = await client.post(
      `/reviews/reviews/${reviewId}/response/`,
      { body }
    );
    return data;
  },

  updateResponse: async (reviewId: string, body: string) => {
    const { data } = await client.patch(
      `/reviews/reviews/${reviewId}/response/`,
      { body }
    );
    return data;
  },

  deleteResponse: async (reviewId: string) => {
    await client.delete(`/reviews/reviews/${reviewId}/response/`);
  },

  // ── Public ──

  getDoctorReviews: async (doctorId: string, params?: { page?: number }) => {
    const { data } = await client.get<PaginatedResponse<ConsultationReview>>(
      `/reviews/doctors/${doctorId}/reviews/`,
      { params }
    );
    return data;
  },

  getDoctorReputation: async (doctorId: string) => {
    const { data } = await client.get<DoctorReputation>(
      `/reviews/doctors/${doctorId}/reputation/`
    );
    return data;
  },

  // ── Report ──

  reportReview: async (reviewId: string, payload: {
    reason: string;
    description?: string;
  }) => {
    const { data } = await client.post(
      `/reviews/reviews/${reviewId}/report/`,
      payload
    );
    return data;
  },

  // ── Staff ──

  listReviews: async (params?: { status?: string; rating?: number; page?: number }) => {
    const { data } = await client.get<PaginatedResponse<ConsultationReview>>(
      "/staff/reviews/",
      { params }
    );
    return data;
  },

  moderateReview: async (reviewId: string, payload: {
    status: string;
    moderation_reason?: string;
  }) => {
    const { data } = await client.patch<ConsultationReview>(
      `/staff/reviews/${reviewId}/moderate/`,
      payload
    );
    return data;
  },

  listReports: async (params?: { resolved?: string; page?: number }) => {
    const { data } = await client.get("/staff/reviews/reports/", { params });
    return data as PaginatedResponse<{
      id: string;
      review: string;
      reporter: string;
      reason: string;
      description: string;
      resolved_at: string | null;
      resolution: string;
      resolution_notes: string;
      created_at: string;
    }>;
  },

  resolveReport: async (reportId: string, payload: {
    resolution: string;
    resolution_notes?: string;
  }) => {
    const { data } = await client.patch(
      `/staff/reviews/reports/${reportId}/resolve/`,
      payload
    );
    return data;
  },
};
