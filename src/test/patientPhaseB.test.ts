import { beforeEach, describe, expect, it, vi } from "vitest";
import client from "../api/client";
import { consultationsApi } from "../api/consultations";
import { doctorsApi } from "../api/doctors";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";
import { formatDoctorMoney, formatEstimatedResponse } from "../utils/doctorFormatting";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const get = vi.mocked(client.get);
const post = vi.mocked(client.post);

describe("Patient Phase B API contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends all discovery filters and consumes paginated results", async () => {
    get.mockResolvedValueOnce({
      data: { count: 0, next: null, previous: null, results: [] },
    });
    const filters = {
      search: "cardiac",
      specialty: "7c054dc1-1cf7-4eca-a3ae-72786d11e904",
      language: "ar" as const,
      accepting: true,
      min_experience: 5,
      min_fee: "10.00",
      max_fee: "100.00",
      max_response_minutes: 120,
      ordering: "experience_desc" as const,
      page: 2,
      page_size: 12,
      locale: "ar" as const,
    };

    const response = await doctorsApi.list(filters);

    expect(response.results).toEqual([]);
    expect(get).toHaveBeenCalledWith("/doctors/", { params: filters });
  });

  it("fetches public detail from canonical endpoint", async () => {
    get.mockResolvedValueOnce({ data: { id: "doctor-id" } });
    await doctorsApi.getById("doctor-id");
    expect(get).toHaveBeenCalledWith("/doctors/doctor-id/");
  });

  it("creates with doctor, normalized description, idempotency, and freshness only", async () => {
    const payload = {
      doctor: "6fdab3bf-6527-4759-9199-15cfb02274f0",
      description: "Persistent symptoms needing medical guidance.",
      client_request_id: "59e1e346-25fe-4625-a1f7-5f356282af6c",
      expected_doctor_updated_at: "2026-07-28T08:00:00Z",
    };
    post.mockResolvedValueOnce({ data: { id: "consultation-id", next_path: "/next" } });

    await consultationsApi.create(payload);

    expect(post).toHaveBeenCalledWith("/consultations/", payload);
    expect(payload).not.toHaveProperty("specialty");
    expect(payload).not.toHaveProperty("patient");
    expect(payload).not.toHaveProperty("priority");
  });
});

describe("Patient Phase B presentation", () => {
  it("formats server currency without a hardcoded symbol", () => {
    expect(formatDoctorMoney({ amount: "75.00", currency: "USD" }, "en")).toMatch(/75/);
    expect(formatDoctorMoney({ amount: "75.00", currency: "EUR" }, "en")).toMatch(/€|EUR/);
  });

  it("presents response time as a human estimate", () => {
    const t = (key: string, params?: Record<string, string | number>) =>
      `${key}:${params ? JSON.stringify(params) : ""}`;
    expect(formatEstimatedResponse(20, t)).toContain("responseUnder30");
    expect(formatEstimatedResponse(90, t)).toContain('"hours":2');
    expect(formatEstimatedResponse(2_880, t)).toContain('"days":2');
  });

  it("covers Phase B keys in English, Arabic, and Kurdish", () => {
    for (const dictionary of [en, ar, ckb] as Array<Record<string, string>>) {
      for (const key of [
        "doctor.filters",
        "doctor.startConsultation",
        "doctor.responseHours",
        "doctor.unavailableReason.not_accepting_consultations",
        "consultation.stepReview",
        "consultation.descriptionMin",
        "consultation.error.doctor_state_changed",
      ]) {
        expect(dictionary[key], `${key} missing`).toBeTruthy();
        expect(dictionary[key]).not.toBe(key);
      }
    }
  });
});
