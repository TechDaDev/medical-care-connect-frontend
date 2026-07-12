import client from "./client";
import { MedicalRecordDraft } from "../types";

export const medicalRecordsApi = {
  getById: async (id: string) => {
    const { data } = await client.get<MedicalRecordDraft>(
      `/medical-records/${id}/`
    );
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await client.patch<MedicalRecordDraft>(
      `/medical-records/${id}/`,
      payload
    );
    return data;
  },

  confirm: async (id: string, confirmed: boolean) => {
    const { data } = await client.post(`/medical-records/${id}/confirm/`, {
      confirmed,
    });
    return data;
  },
};
