import client from "./client";
import { LoginResponse, RegisterResponse, User } from "../types";

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await client.post<LoginResponse>("/auth/login/", {
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
    const { data } = await client.post<RegisterResponse>(
      "/auth/register/patient/",
      payload
    );
    return data;
  },

  logout: async (refreshToken: string) => {
    await client.post("/auth/logout/", { refresh: refreshToken });
  },

  refresh: async (refreshToken: string) => {
    const { data } = await client.post<{ access: string }>(
      "/auth/token/refresh/",
      { refresh: refreshToken }
    );
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
    const { data } = await client.get("/patients/me/");
    return data;
  },

  updatePatientProfile: async (payload: Record<string, unknown>) => {
    const { data } = await client.patch("/patients/me/", payload);
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
