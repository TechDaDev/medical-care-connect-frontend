import { ApiError } from "../types";

export class ApiRequestError extends Error {
  status: number;
  data: ApiError;

  constructor(status: number, data: ApiError) {
    super(data.detail || `Request failed with status ${status}`);
    this.name = "ApiRequestError";
    this.status = status;
    this.data = data;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 503) return "Service temporarily unavailable.";
    if (error.status === 429) return "Too many requests. Please wait.";
    if (error.status === 500) return "Server error. Please try again.";
    if (error.status === 404) return "Resource not found.";
    if (error.status === 403) return "You do not have permission.";
    if (error.status === 401) return "Session expired. Please log in again.";
    if (error.status === 400) {
      const msg = error.data?.detail;
      if (msg) return msg;
      return Object.values(error.data)
        .flat()
        .join(" ");
    }
    return error.message;
  }
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Network error. Check your connection.";
  }
  return "An unexpected error occurred.";
}
