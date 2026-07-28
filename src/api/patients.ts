import client from "./client";
import { PaginatedResponse, PatientMessageThread } from "../types";

export const patientsApi = {
  listMessageThreads: async (
    params: Record<string, string | number | undefined>,
  ) => {
    const { data } = await client.get<PaginatedResponse<PatientMessageThread>>(
      "/patients/me/message-threads/",
      { params },
    );
    return data;
  },
};
