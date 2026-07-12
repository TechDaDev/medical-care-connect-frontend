import client from "./client";
import { User, PatientProfile, PatientDashboardData } from "../types";

export interface LoginResponseData {
  user: User;
}

export interface RegisterResponseData {
  user: User;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await client.post<LoginResponseData>("/auth/login/", {
      email,
      password,
    });
    return data;
  },

  registerPatient: async (payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
    password_confirm: string;
  }) => {
    const { data } = await client.post<RegisterResponseData>(
      "/auth/register/patient/",
      payload
    );
    return data;
  },

  logout: async () => {
    await client.post("/auth/logout/");
  },

  refresh: async () => {
    await client.post("/auth/token/refresh/");
  },

  getCsrfToken: async () => {
    const { data } = await client.get<{ csrfToken: string }>("/auth/csrf/");
    return data;
  },
};

export const accountsApi = {
  getMe: async () => {
    const { data } = await client.get<User>("/accounts/me/");
    return data;
  },

  updateMe: async (payload: Partial<User>) => {
    const { data } = await client.patch<User>("/accounts/me/", payload);
    return data;
  },

  getPatientProfile: async () => {
    const { data } = await client.get<PatientProfile>("/patients/me/");
    return data;
  },

  updatePatientProfile: async (payload: Record<string, unknown>) => {
    const { data } = await client.patch<PatientProfile>("/patients/me/", payload);
    return data;
  },

  getPatientDashboard: async () => {
    const { data } = await client.get<PatientDashboardData>("/patients/me/dashboard/");
    return data;
  },

  getDoctorProfile: async () => {
    const { data } = await client.get("/doctors/me/");
    return data;
  },

  updateDoctorProfile: async (payload: Record<string, unknown>) => {
    const { data } = await client.patch("/doctors/me/", payload);
    return data;
  },
};
