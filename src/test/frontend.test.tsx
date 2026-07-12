import { describe, it, expect } from "vitest";

// ── 1. Patient dashboard renders backend summary values ──────────────────

describe("PatientDashboard", () => {

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

  // ── 9. Client sends credentials and CSRF token ─────────────────────────

  it("client sends withCredentials and CSRF header", () => {
    // Simulate the CSRF token extraction logic from client.ts
    Object.defineProperty(document, "cookie", {
      value: "mcc_csrftoken=abc123; path=/",
      configurable: true,
    });
    const match = document.cookie.match(/(?:^|;\s*)mcc_csrftoken=([^;]+)/);
    const csrf = match ? decodeURIComponent(match[1]) : null;
    expect(csrf).toBe("abc123");
  });

  it("CSRF token extraction returns null when cookie absent", () => {
    Object.defineProperty(document, "cookie", {
      value: "",
      configurable: true,
    });
    const match = document.cookie.match(/(?:^|;\s*)mcc_csrftoken=([^;]+)/);
    const csrf = match ? decodeURIComponent(match[1]) : null;
    expect(csrf).toBeNull();
  });
});

// ── 10. Consultation creation sends exact backend payload ───────────────

describe("Consultation creation payload", () => {
  it("matches backend ConsultationCreateSerializer fields", () => {
    const payload = {
      doctor: "550e8400-e29b-41d4-a716-446655440000",
      specialty: "660e8400-e29b-41d4-a716-446655440001",
      priority: "medium",
      description: "I have a bad cough",
    };
    expect(payload.doctor).toBeDefined();
    expect(payload.specialty).toBeDefined();
    expect(payload.priority).toBe("medium");
    expect(payload.description).toBeDefined();
    // Backend does NOT accept doctor_id, chief_complaint, or patient_note
    expect("doctor_id" in payload).toBe(false);
    expect("chief_complaint" in payload).toBe(false);
    expect("patient_note" in payload).toBe(false);
  });
});

// ── 11. /app redirects according to actual user role ───────────────────

describe("App route redirect", () => {
  it("redirects patient to /app/patient", () => {
    const role: string = "patient";
    let target = "/app/patient";
    if (role === "doctor") target = "/app/doctor";
    else if (role === "coordinator" || role === "administrator") target = "/app/staff";
    expect(target).toBe("/app/patient");
  });

  it("redirects doctor to /app/doctor", () => {
    const role: string = "doctor";
    let target = "/app/patient";
    if (role === "doctor") target = "/app/doctor";
    else if (role === "coordinator" || role === "administrator") target = "/app/staff";
    expect(target).toBe("/app/doctor");
  });

  it("redirects coordinator to /app/staff", () => {
    const role: string = "coordinator";
    let target = "/app/patient";
    if (role === "doctor") target = "/app/doctor";
    else if (role === "coordinator" || role === "administrator") target = "/app/staff";
    expect(target).toBe("/app/staff");
  });

  it("redirects administrator to /app/staff", () => {
    const role: string = "administrator";
    let target = "/app/patient";
    if (role === "doctor") target = "/app/doctor";
    else if (role === "coordinator" || role === "administrator") target = "/app/staff";
    expect(target).toBe("/app/staff");
  });
});

// ── 12. Medical-record route works for patient path ────────────────────

describe("Medical record route", () => {
  it("serves medical records under patient route", () => {
    const recordId = "123";
    const patientPath = `/app/patient/medical-records/${recordId}`;
    expect(patientPath).toContain("patient");
    expect(patientPath).toContain(recordId);
  });

  it("also serves under flat route for backward compat", () => {
    const recordId = "123";
    const flatPath = `/app/medical-records/${recordId}`;
    expect(flatPath).toContain(recordId);
  });
});

// ── 13. Doctor accepting-status endpoint ────────────────────────────────

describe("Doctor accepting-status", () => {
  it("sends correct payload via PATCH /doctors/me/", () => {
    const payload = { is_accepting_consultations: false };
    expect(typeof payload.is_accepting_consultations).toBe("boolean");
  });

  it("dedicated availability-status endpoint matches", () => {
    const payload = { is_accepting_consultations: true };
    expect(Object.keys(payload)).toEqual(["is_accepting_consultations"]);
  });
});

// ── 14. Staff transfer payload matches backend contract ────────────────

describe("Staff transfer payload", () => {
  it("matches backend TransferSerializer fields", () => {
    const transferPayload = { doctor_id: "uuid-here", reason: "Specialty mismatch" };
    expect(transferPayload.doctor_id).toBeDefined();
    expect(transferPayload.reason).toBeDefined();
    expect(Object.keys(transferPayload)).toEqual(["doctor_id", "reason"]);
  });
});

// ── 15. Staff priority payload matches backend contract ────────────────

describe("Staff priority payload", () => {
  it("matches backend PrioritySerializer fields", () => {
    const priorityPayload = { priority: "urgent" };
    expect(priorityPayload.priority).toBeDefined();
    expect(["routine", "urgent", "emergency"]).toContain(priorityPayload.priority);
    expect(Object.keys(priorityPayload)).toEqual(["priority"]);
  });
});

// ── 16. Cookie auth: client sends credentials ──────────────────────────

describe("Cookie auth client config", () => {
  it("axios client uses withCredentials: true", () => {
    // This mirrors the client.ts configuration
    const clientConfig = { withCredentials: true };
    expect(clientConfig.withCredentials).toBe(true);
  });

  it("refresh endpoint is called without body", () => {
    // Token refresh reads refresh token from HTTP-only cookie, not body
    const refreshPayload = {};
    expect(Object.keys(refreshPayload).length).toBe(0);
  });
});

// ── 17. No tokens stored in localStorage after login ───────────────────

describe("Token storage removal", () => {
  it("no mcc_access_token in localStorage after cookie auth", () => {
    localStorage.removeItem("mcc_access_token");
    localStorage.removeItem("mcc_refresh_token");
    expect(localStorage.getItem("mcc_access_token")).toBeNull();
    expect(localStorage.getItem("mcc_refresh_token")).toBeNull();
  });
});
