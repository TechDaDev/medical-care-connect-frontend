import axios from "axios";
import { ApiRequestError } from "../utils/errors";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ── Cookie reader ──────────────────────────────────────────────────────────

export function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  for (const item of document.cookie.split(";")) {
    const cookie = item.trim();
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }
  return null;
}

// ── CSRF priming (single-flight) ────────────────────────────────────────────

let csrfPromise: Promise<void> | null = null;

/**
 * Ensure the mcc_csrftoken cookie exists.  Fetches GET /auth/csrf/ once;
 * concurrent callers share the same in-flight promise (single-flight).
 */
export async function ensureCsrfToken(): Promise<void> {
  if (readCookie("mcc_csrftoken")) return;

  if (!csrfPromise) {
    csrfPromise = client
      .get("/auth/csrf/", { withCredentials: true })
      .then(() => undefined)
      .finally(() => { csrfPromise = null; });
  }
  await csrfPromise;
}

// ── Request interceptor ────────────────────────────────────────────────────

const WRITE_METHODS = new Set(["post", "put", "patch", "delete"]);

client.interceptors.request.use(async (config) => {
  config.withCredentials = true;

  // Let browser set Content-Type for FormData (with boundary)
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  // Prime CSRF token before state-changing methods
  const method = config.method?.toLowerCase();
  if (method && WRITE_METHODS.has(method)) {
    await ensureCsrfToken();
    const csrf = readCookie("mcc_csrftoken");
    if (csrf) {
      config.headers["X-CSRFToken"] = csrf;
    }
  }

  return config;
});

// ── Response interceptor (401 auto-refresh + 403 CSRF retry) ────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── 401 auto-refresh ──
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
        }).then(() => client(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        await axios.post(`${API_BASE}/auth/token/refresh/`, {}, { withCredentials: true });
        refreshQueue.forEach((q) => q.resolve());
        refreshQueue = [];
        return client(originalRequest);
      } catch {
        refreshQueue.forEach((q) => q.reject(error));
        refreshQueue = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // ── One-time CSRF retry ──
    if (
      error.response?.status === 403 &&
      !originalRequest._csrfRetried &&
      typeof error.response.data?.detail === "string" &&
      error.response.data.detail.toLowerCase().includes("csrf")
    ) {
      originalRequest._csrfRetried = true;
      // Clear stale promise so next ensureCsrfToken re-fetches
      csrfPromise = null;
      try {
        await ensureCsrfToken();
        const csrf = readCookie("mcc_csrftoken");
        if (csrf) {
          originalRequest.headers["X-CSRFToken"] = csrf;
        }
        return client(originalRequest);
      } catch {
        return Promise.reject(
          new ApiRequestError(error.response.status, error.response.data)
        );
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
