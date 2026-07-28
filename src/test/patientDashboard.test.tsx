import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountsApi } from "../api/auth";
import { ConsultationStatusBadge } from "../components/consultations/ConsultationStatusBadge";
import { buildNavigationItems } from "../components/layout/navigation";
import { I18nProvider } from "../i18n";
import { PatientDashboard } from "../pages/patient/PatientDashboard";
import {
  ConsultationStatus,
  type PatientDashboardData,
  UserRole,
} from "../types";

vi.mock("../api/auth", () => ({
  accountsApi: {
    getPatientDashboard: vi.fn(),
  },
}));

const getDashboard = vi.mocked(accountsApi.getPatientDashboard);

const dashboardData: PatientDashboardData = {
  consultations: {
    total: 7,
    active: 4,
    awaiting_patient: 1,
    awaiting_doctor: 1,
    intake_in_progress: 1,
    doctor_review: 1,
    follow_up_required: 1,
    physical_visit_required: 0,
    emergency_escalated: 0,
    completed: 2,
    cancelled: 1,
  },
  attention: {
    total: 2,
    items: [
      {
        type: "awaiting_patient_response",
        consultation_id: "consultation-1",
        title_key: "patientDashboard.attention.awaitingPatient.title",
        description_key:
          "patientDashboard.attention.awaitingPatient.description",
        count: 1,
        severity: "warning",
        created_at: "2026-07-28T09:00:00Z",
        action_path: "/app/patient/consultations/consultation-1",
      },
      {
        type: "unread_messages",
        consultation_id: "consultation-1",
        title_key: "patientDashboard.attention.unreadMessages.title",
        description_key:
          "patientDashboard.attention.unreadMessages.description",
        count: 3,
        severity: "info",
        created_at: "2026-07-28T10:00:00Z",
        action_path: "/app/patient/messages/consultation-1",
      },
    ],
  },
  messages: {
    unread_total: 3,
    recent_threads: [
      {
        consultation_id: "consultation-1",
        doctor_name: "Synthetic Doctor",
        specialty_name: "Synthetic Specialty",
        unread_count: 3,
        last_message_at: "2026-07-28T10:00:00Z",
      },
    ],
  },
  notifications: {
    unread_total: 1,
    recent: [
      {
        id: "notification-1",
        notification_type: "new_message",
        title: "Consultation update",
        body: "A safe dashboard notification.",
        is_read: false,
        created_at: "2026-07-28T10:05:00Z",
        consultation_id: "consultation-1",
      },
      {
        id: "notification-2",
        notification_type: "status_change",
        title: "General update",
        body: "A safe general notification.",
        is_read: true,
        created_at: "2026-07-28T09:05:00Z",
        consultation_id: null,
      },
    ],
  },
  profile: {
    completion_percent: 70,
    missing_fields: ["address", "blood_type"],
    emergency_contact_complete: false,
    basic_health_complete: true,
  },
  recent_consultations: [
    {
      id: "consultation-1",
      status: ConsultationStatus.AWAITING_PATIENT_RESPONSE,
      doctor_name: "Synthetic Doctor",
      specialty_name: "Synthetic Specialty",
      created_at: "2026-07-27T10:00:00Z",
      updated_at: "2026-07-28T10:00:00Z",
      unread_messages: 3,
      needs_patient_action: true,
      has_medical_record: true,
    },
  ],
  generated_at: "2026-07-28T10:10:00Z",
};

function renderDashboard(locale: "en" | "ar" | "ckb" = "en") {
  localStorage.setItem("mcc_lang", locale);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <PatientDashboard />
        </QueryClientProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

function renderStatuses(locale: "en" | "ar" | "ckb") {
  localStorage.setItem("mcc_lang", locale);
  return render(
    <I18nProvider>
      {Object.values(ConsultationStatus).map((status) => (
        <ConsultationStatusBadge key={status} status={status} />
      ))}
    </I18nProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  getDashboard.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("Patient Phase A dashboard", () => {
  it("renders complete contract, links, counts, and generated time", async () => {
    getDashboard.mockResolvedValue(dashboardData);
    renderDashboard();

    expect(
      await screen.findByRole("heading", { name: "Patient dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Needs your attention" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Consultation summary" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recent messages" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recent notifications" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Profile completeness" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recent consultations" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Last updated Jul 28, 2026/),
    ).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("3 unread")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Open Awaiting your response" }),
    ).toHaveAttribute(
      "href",
      "/app/patient/consultations/consultation-1",
    );
    expect(
      screen.getByRole("link", {
        name: "Open messages with Synthetic Doctor",
      }),
    ).toHaveAttribute("href", "/app/patient/messages/consultation-1");
    expect(
      screen.getByRole("link", {
        name: "Open notification: Consultation update",
      }),
    ).toHaveAttribute(
      "href",
      "/app/patient/consultations/consultation-1",
    );
    expect(
      screen.getByRole("link", {
        name: "Open notification: General update",
      }),
    ).toHaveAttribute("href", "/app/notifications");
    expect(
      screen
        .getAllByRole("link", { name: "Complete profile" })
        .every((link) => link.getAttribute("href") === "/app/profile"),
    ).toBe(true);
    expect(
      screen.getByRole("link", { name: "View privacy settings" }),
    ).toHaveAttribute("href", "/app/privacy");
    expect(document.body.textContent).not.toMatch(
      /patientDashboard\.|consultation\.status\./,
    );
  });

  it("renders empty states without hiding dashboard sections", async () => {
    getDashboard.mockResolvedValue({
      ...dashboardData,
      attention: { total: 0, items: [] },
      messages: { unread_total: 0, recent_threads: [] },
      notifications: { unread_total: 0, recent: [] },
      recent_consultations: [],
    });
    renderDashboard();

    expect(
      await screen.findByText("Nothing needs your attention right now."),
    ).toBeInTheDocument();
    expect(screen.getByText("No recent message threads.")).toBeInTheDocument();
    expect(screen.getByText("No recent notifications.")).toBeInTheDocument();
    expect(screen.getByText("No recent consultations.")).toBeInTheDocument();
  });

  it("shows accessible loading state", () => {
    getDashboard.mockImplementation(() => new Promise(() => undefined));
    renderDashboard();

    expect(
      screen.getByLabelText("Loading patient dashboard"),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("shows error and retries successfully", async () => {
    getDashboard
      .mockRejectedValueOnce(new Error("dashboard unavailable"))
      .mockResolvedValueOnce(dashboardData);
    const user = userEvent.setup();
    renderDashboard();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", { name: "Patient dashboard" }),
    ).toBeInTheDocument();
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });

  it("manual refresh fetches contract again", async () => {
    getDashboard.mockResolvedValue(dashboardData);
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByRole("heading", { name: "Patient dashboard" });

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2));
  });

  it("attention actions are keyboard reachable", async () => {
    getDashboard.mockResolvedValue(dashboardData);
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByRole("heading", { name: "Patient dashboard" });

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Refresh" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "Open Awaiting your response" }),
    );
  });
});

describe("ConsultationStatusBadge", () => {
  it.each([
    ["en", "ltr", "Awaiting patient response"],
    ["ar", "rtl", "بانتظار رد المريض"],
    ["ckb", "rtl", "چاوەڕێی وەڵامی نەخۆش"],
  ] as const)("localizes every status for %s", async (locale, direction, sample) => {
    renderStatuses(locale);

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("dir", direction),
    );
    expect(
      screen.getAllByText(sample, { exact: true }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/.+/)).toHaveLength(
      Object.values(ConsultationStatus).length,
    );
    expect(document.body.textContent).not.toContain("consultation.status.");
  });
});

describe("Patient navigation", () => {
  const translate = (key: string) => key;

  it("shows privacy for patient", () => {
    const paths = buildNavigationItems(UserRole.PATIENT, translate).map(
      (item) => item.path,
    );
    expect(paths).toContain("/app/privacy");
  });

  it("leaves doctor, coordinator, and administrator navigation unchanged", () => {
    expect(
      buildNavigationItems(UserRole.DOCTOR, translate).map(
        (item) => item.path,
      ),
    ).toEqual([
      "/app/doctor",
      "/app/doctor/consultations",
      "/app/doctor/reviews",
      "/app/notifications",
      "/app/doctor/profile",
    ]);
    expect(
      buildNavigationItems(UserRole.COORDINATOR, translate).map(
        (item) => item.path,
      ),
    ).toEqual([
      "/app/staff",
      "/app/staff/consultations",
      "/app/staff/doctor-applications",
      "/app/staff/reviews",
      "/app/staff/doctors",
      "/app/notifications",
      "/app/profile",
    ]);
    expect(
      buildNavigationItems(UserRole.ADMINISTRATOR, translate).map(
        (item) => item.path,
      ),
    ).toEqual([
      "/app/staff",
      "/app/staff/consultations",
      "/app/staff/doctor-applications",
      "/app/staff/users",
      "/app/staff/reviews",
      "/app/staff/doctors",
      "/app/staff/privacy-requests",
      "/app/staff/audit",
      "/app/staff/specialties",
      "/app/staff/attachments",
      "/app/staff/operations",
      "/app/notifications",
      "/app/profile",
    ]);
  });
});
