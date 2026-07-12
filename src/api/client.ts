import axios from "axios";
import { ApiRequestError } from "../utils/errors";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // sends HTTP-only cookies
});

// ── CSRF token injection ───────────────────────────────────────────────────

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)mcc_csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

client.interceptors.request.use((config) => {
  // CSRF token for state-changing methods
  if (config.method && !/^get$/i.test(config.method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers["X-CSRFToken"] = csrf;
    }
  }

  return config;
});

// ── Response interceptor ────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/token/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          refreshQueue.push({ resolve: () => resolve(), reject });
        }).then(() => {
          return client(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Backend reads refresh token from HTTP-only cookie
        await axios.post(`${API_BASE}/auth/token/refresh/`, {}, {
          withCredentials: true,
        });
        refreshQueue.forEach((q) => q.resolve());
        refreshQueue = [];
        return client(originalRequest);
      } catch {
        refreshQueue.forEach((q) => q.reject(error));
        refreshQueue = [];
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      return Promise.reject(
        new ApiRequestError(error.response.status, error.response.data)
      );
    }
    return Promise.reject(error);
  }
);

export default client;
