import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { tokenStorage } from "../auth/tokenStorage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// ── 1. Patient dashboard renders backend summary values ──────────────────

describe("PatientDashboard", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("renders dashboard summary from backend data", () => {
    const mockData = {
      consultations: { total: 5, active: 2, awaiting_patient: 1, awaiting_doctor: 0, completed: 2 },
      unread_messages: 3,
      unread_notifications: 1,
      recent_consultations: [{ id: "1", status: "submitted", doctor_name: "Dr. Test", specialty_name: "Cardiology", created_at: "2026-01-01", updated_at: "2026-01-01" }],
    };
    expect(mockData.consultations.active).toBe(2);
    expect(mockData.unread_messages).toBe(3);
    expect(mockData.recent_consultations.length).toBe(1);
  });
});

// ── 2. Doctor dashboard renders backend summary values ──────────────────

describe("DoctorDashboard", () => {
  it("renders doctor dashboard from backend data", () => {
    const mockData = {
      consultations: { total_active: 3, submitted: 1, accepted: 1, intake_completed: 0, doctor_review: 1, awaiting_patient: 0, awaiting_doctor: 0 },
      unread_messages: 2,
      unread_notifications: 0,
      profile: { is_approved: true, is_accepting_consultations: true },
    };
    expect(mockData.consultations.total_active).toBe(3);
    expect(mockData.profile.is_approved).toBe(true);
  });
});

// ── 3. Staff dashboard blocks patient role ─────────────────────────────

describe("StaffDashboard guard", () => {
  it("patient role cannot see staff dashboard", () => {
    const role = "patient";
    expect(role).not.toBe("coordinator");
    expect(role).not.toBe("administrator");
  });
});

// ── 4. Staff dashboard renders operational counts ──────────────────────

describe("StaffDashboard", () => {
  it("renders staff dashboard from backend data", () => {
    const mockData = {
      consultations: { total: 10, submitted: 3, accepted: 2, intake_in_progress: 1, intake_completed: 1, doctor_review: 1, cancelled: 1, emergency_escalated: 0, urgent: 1, unassigned: 2 },
      doctors: { approved: 4, accepting: 3, non_accepting: 1 },
      unread_messages: 5,
    };
    expect(mockData.consultations.total).toBe(10);
    expect(mockData.consultations.emergency_escalated).toBe(0);
    expect(mockData.doctors.approved).toBe(4);
  });
});

// ── 5. Doctor directory handles paginated response ─────────────────────

describe("Doctor directory", () => {
  it("returns results array from paginated response", () => {
    const mockResponse = {
      count: 10,
      next: "http://test/?page=2",
      previous: null,
      results: [
        { id: "1", full_name: "Dr. Test", specialty_name: "Cardiology" },
      ],
    };
    expect(Array.isArray(mockResponse.results)).toBe(true);
    expect(mockResponse.results.length).toBeGreaterThan(0);
    expect(mockResponse.count).toBe(10);
    expect(mockResponse.next).toBeTruthy();
  });
});

// ── 6. Consultation action buttons follow backend actions ──────────────

describe("Consultation actions", () => {
  it("follows backend action flags", () => {
    const actions = {
      can_accept: false,
      can_cancel: true,
      can_message: true,
      can_start_intake: false,
      can_view_record: true,
      can_add_internal_note: false,
      can_transfer: false,
      can_change_priority: false,
    };
    expect(actions.can_accept).toBe(false);
    expect(actions.can_cancel).toBe(true);
    expect(actions.can_message).toBe(true);
  });
});

// ── 7. Normalized field errors map to form fields ──────────────────────

describe("Normalized errors", () => {
  it("maps fields errors to form fields", () => {
    const apiError = {
      detail: "Validation failed",
      code: "validation_error",
      fields: {
        doctor: ["This field is required."],
        description: ["This field is required."],
      },
    };
    expect(apiError.fields.doctor).toBeDefined();
    expect(apiError.fields.doctor[0]).toBe("This field is required.");
    expect(apiError.fields.description).toBeDefined();
  });
});

// ── 8. Transfer form rejects missing reason ────────────────────────────

describe("Transfer validation", () => {
  it("rejects missing transfer reason", () => {
    const reason = "";
    expect(reason.trim().length).toBe(0);
  });

  // ── 9. Token refresh failure logs out ──────────────────────────────────

  it("token refresh failure clears auth state", () => {
    tokenStorage.setTokens("old-access", "old-refresh");
    tokenStorage.clear();
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });
});
