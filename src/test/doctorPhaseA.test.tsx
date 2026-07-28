import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { doctorsApi } from "../api/doctors";
import { DoctorAccessGate } from "../components/doctor/DoctorAccessGate";
import { buildNavigationItems } from "../components/layout/navigation";
import { I18nProvider } from "../i18n";
import { DoctorAvailabilityPage } from "../pages/doctor/DoctorAvailabilityPage";
import { DoctorDashboard } from "../pages/doctor/DoctorDashboard";
import type {
  DoctorAccessState,
  DoctorAvailabilityData,
  DoctorDashboardData,
} from "../types";
import { UserRole } from "../types";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";

const access: DoctorAccessState = {
  state: "approved",
  can_access_dashboard: true,
  can_manage_availability: true,
  can_accept_consultations: true,
  can_edit_profile: true,
  reason_code: null,
  approval_status: "approved",
  is_approved: true,
  is_accepting_consultations: false,
  profile_id: "doctor-1",
  updated_at: "2026-07-28T10:00:00Z",
  next_path: "/app/doctor",
};

const dashboard: DoctorDashboardData = {
  access,
  profile: {
    id: "doctor-1",
    full_name: "Dr Phase Tester",
    professional_title: "Consultant",
    specialty_name: "General medicine",
    approval_status: "approved",
    is_approved: true,
    is_accepting_consultations: false,
    completion_percent: 80,
    missing_fields: ["biography", "languages"],
  },
  consultations: {
    total_active: 4,
    submitted: 1,
    accepted: 1,
    intake_in_progress: 0,
    intake_completed: 1,
    doctor_review: 0,
    awaiting_patient: 0,
    awaiting_doctor: 1,
    under_review: 0,
    follow_up_required: 0,
    physical_visit_required: 0,
    transferred: 0,
    emergency_escalated: 0,
    completed: 2,
    cancelled: 0,
  },
  attention: {
    total: 2,
    items: [
      {
        type: "new_consultation",
        consultation_id: "consultation-1",
        review_id: null,
        count: 1,
        severity: "warning",
        title_key: "doctor.attention.new_consultation.title",
        description_key: "doctor.attention.new_consultation.description",
        created_at: null,
        action_path: "/app/doctor/consultations/consultation-1",
      },
      {
        type: "unread_messages",
        consultation_id: null,
        review_id: null,
        count: 1,
        severity: "warning",
        title_key: "doctor.attention.unread_messages.title",
        description_key: "doctor.attention.unread_messages.description",
        created_at: null,
        action_path: "/app/doctor/consultations",
      },
    ],
  },
  messages: {
    unread_total: 1,
    recent_threads: [
      {
        consultation_id: "consultation-1",
        patient_display_name: "Patient One",
        consultation_status: "submitted",
        unread_count: 1,
        last_message_at: "2026-07-28T09:00:00Z",
        action_path: "/app/doctor/consultations/consultation-1",
      },
    ],
  },
  notifications: {
    unread_total: 1,
    recent: [
      {
        id: "notification-1",
        notification_type: "new_consultation",
        title: "New consultation",
        body: "Review request",
        is_read: false,
        created_at: "2026-07-28T09:00:00Z",
        action_path: "/app/doctor/consultations/consultation-1",
      },
    ],
  },
  reviews: {
    total_reviews: 1,
    average_rating: 5,
    awaiting_response: 1,
    recent: [
      {
        id: "review-1",
        consultation_id: "consultation-1",
        rating: 5,
        is_anonymous: true,
        has_response: false,
        created_at: "2026-07-28T09:00:00Z",
        action_path: "/app/doctor/reviews",
      },
    ],
  },
  availability: {
    timezone: "Asia/Baghdad",
    is_accepting_consultations: false,
    can_toggle_accepting: true,
    toggle_unavailable_reason: null,
    active_slot_count: 1,
    next_available_start: null,
  },
  recent_consultations: [
    {
      id: "consultation-1",
      patient_display_name: "Patient One",
      specialty: { id: "specialty-1", name: "General medicine" },
      status: "submitted",
      priority: "urgent",
      unread_messages: 1,
      needs_doctor_action: true,
      updated_at: "2026-07-28T09:00:00Z",
      action_path: "/app/doctor/consultations/consultation-1",
    },
  ],
  generated_at: "2026-07-28T10:00:00Z",
};

const availability: DoctorAvailabilityData = {
  timezone: "Asia/Baghdad",
  is_accepting_consultations: false,
  can_manage: true,
  generated_at: "2026-07-28T10:00:00Z",
  slots: [
    {
      id: "slot-1",
      day_of_week: "monday",
      start_time: "09:00:00",
      end_time: "12:00:00",
      is_active: true,
      updated_at: "2026-07-28T10:00:00Z",
      version: "2026-07-28T10:00:00Z",
    },
  ],
};

function renderApp(node: React.ReactNode, route = "/") {
  localStorage.setItem("mcc_lang", "en");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <MemoryRouter initialEntries={[route]}>{node}</MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("Doctor Phase A", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  it("adds only valid doctor navigation paths including availability", () => {
    const paths = buildNavigationItems(UserRole.DOCTOR, (key) => key).map((item) => item.path);
    expect(paths).toContain("/app/doctor/availability");
    expect(paths).not.toContain("/app/medical-records");
  });

  it("routes pending doctors from operational pages without blank content", async () => {
    vi.spyOn(doctorsApi, "getAccessState").mockResolvedValue({
      ...access,
      state: "pending",
      can_access_dashboard: false,
      can_manage_availability: false,
      next_path: "/app/doctor/pending-approval",
    });
    renderApp(
      <Routes>
        <Route path="/protected" element={<DoctorAccessGate><div>private</div></DoctorAccessGate>} />
        <Route path="/app/doctor/pending-approval" element={<div>pending page</div>} />
      </Routes>,
      "/protected",
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("pending page")).toBeInTheDocument();
    expect(screen.queryByText("private")).not.toBeInTheDocument();
  });

  it("shows access API failures and retries", async () => {
    const accessMock = vi
      .spyOn(doctorsApi, "getAccessState")
      .mockRejectedValueOnce(new Error("Access unavailable"))
      .mockResolvedValue(access);
    renderApp(<DoctorAccessGate><div>doctor content</div></DoctorAccessGate>);
    expect(await screen.findByText("An unexpected error occurred.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("doctor content")).toBeInTheDocument();
    expect(accessMock).toHaveBeenCalledTimes(2);
  });

  it("renders authoritative dashboard sections, localized status, and safe links", async () => {
    vi.spyOn(doctorsApi, "getDashboard").mockResolvedValue(dashboard);
    renderApp(<DoctorDashboard />);
    expect(await screen.findByText("Welcome, Dr Phase Tester")).toBeInTheDocument();
    expect(screen.getByText("New consultation requests")).toBeInTheDocument();
    expect(screen.getAllByText("Patient One").length).toBeGreaterThan(0);
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("5 of 5 stars")).toBeInTheDocument();
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toMatch(/^https?:/);
    }
  });

  it("updates accepting status using expected server timestamp", async () => {
    vi.spyOn(doctorsApi, "getDashboard").mockResolvedValue(dashboard);
    const toggle = vi.spyOn(doctorsApi, "toggleAccepting").mockResolvedValue({
      changed: true,
      reason: "updated",
      profile_updated_at: "2026-07-28T11:00:00Z",
      ...dashboard.availability,
      is_accepting_consultations: true,
    });
    renderApp(<DoctorDashboard />);
    const control = await screen.findByRole("switch", { name: "Accepting new consultations" });
    await userEvent.click(control);
    expect(toggle).toHaveBeenCalledWith(true, access.updated_at);
  });

  it("renders weekly availability and labeled edit controls", async () => {
    vi.spyOn(doctorsApi, "getAvailability").mockResolvedValue(availability);
    vi.spyOn(doctorsApi, "getAccessState").mockResolvedValue(access);
    renderApp(<DoctorAvailabilityPage />);
    expect(await screen.findByRole("heading", { name: "Availability" })).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("09:00–12:00")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Accepting new consultations" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add availability" }));
    expect(screen.getByRole("dialog", { name: "Add availability" })).toBeInTheDocument();
    expect(screen.getByLabelText("Weekday")).toBeInTheDocument();
    expect(screen.getByLabelText("Start time")).toBeInTheDocument();
    expect(screen.getByLabelText("End time")).toBeInTheDocument();
  });

  it("submits availability creation through server API", async () => {
    vi.spyOn(doctorsApi, "getAvailability").mockResolvedValue({ ...availability, slots: [] });
    vi.spyOn(doctorsApi, "getAccessState").mockResolvedValue(access);
    const create = vi.spyOn(doctorsApi, "createAvailability").mockResolvedValue(availability.slots[0]);
    renderApp(<DoctorAvailabilityPage />);
    const addButtons = await screen.findAllByRole("button", { name: "Add availability" });
    await userEvent.click(addButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        day_of_week: "monday",
        start_time: "09:00",
        end_time: "12:00",
        is_active: true,
      }),
    );
  });

  it("keeps Doctor Phase A translation keys aligned across three locales", () => {
    const keys = Object.keys(en).filter(
      (key) =>
        key.startsWith("doctor.dashboard.") ||
        key.startsWith("doctor.availability.") ||
        key.startsWith("doctor.attention.") ||
        key.startsWith("doctor.access."),
    );
    expect(keys.length).toBeGreaterThan(50);
    for (const key of keys) {
      expect(ar).toHaveProperty(key);
      expect(ckb).toHaveProperty(key);
      expect(en[key as keyof typeof en]).not.toBe(key);
    }
  });
});
