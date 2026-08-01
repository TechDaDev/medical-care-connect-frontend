import { beforeEach, describe, expect, it, vi } from "vitest";
import client from "../api/client";
import { medicalRecordsApi } from "../api/medicalRecords";
import { consultationsApi } from "../api/consultations";
import { buildNavigationItems } from "../components/layout/navigation";
import { UserRole } from "../types";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import ckb from "../locales/ckb.json";

vi.mock("../api/client", () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const get = vi.mocked(client.get);
const post = vi.mocked(client.post);
const patch = vi.mocked(client.patch);

describe("Doctor Phase C API contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses isolated doctor list filters without narrative fields", async () => {
    const filters = { record_status: "draft", needs_doctor_action: true, page: 2 };
    get.mockResolvedValueOnce({ data: { count: 0, next: null, previous: null, results: [] } });
    await medicalRecordsApi.listDoctorMedicalRecords(filters);
    expect(get).toHaveBeenCalledWith("/doctors/me/medical-records/", { params: filters });
  });

  it("creates by consultation ID and reads by returned record ID", async () => {
    post.mockResolvedValueOnce({ data: { id: "record-id" } });
    get.mockResolvedValueOnce({ data: { id: "record-id" } });
    await medicalRecordsApi.getOrCreateConsultationMedicalRecord("consultation-id", { client_request_id: "request-id" });
    await medicalRecordsApi.getDoctorMedicalRecord("record-id");
    expect(post).toHaveBeenCalledWith("/consultations/consultation-id/medical-record/", { client_request_id: "request-id" });
    expect(get).toHaveBeenCalledWith("/doctors/me/medical-records/record-id/");
  });

  it("sends optimistic version and idempotency fields for update/finalization", async () => {
    patch.mockResolvedValueOnce({ data: {} });
    post.mockResolvedValueOnce({ data: {} });
    await medicalRecordsApi.updateDoctorMedicalRecord("record-id", { doctor_authored: { assessment: "Synthetic assessment" }, expected_version: 2, client_request_id: "update-id" });
    await medicalRecordsApi.finalizeDoctorMedicalRecord("record-id", { expected_version: 3, client_request_id: "final-id", confirmation: true });
    expect(patch).toHaveBeenCalledWith("/doctors/me/medical-records/record-id/", expect.objectContaining({ expected_version: 2 }));
    expect(post).toHaveBeenCalledWith("/doctors/me/medical-records/record-id/finalize/", expect.objectContaining({ confirmation: true }));
  });

  it("records explicit server-authoritative clinical outcome", async () => {
    post.mockResolvedValueOnce({ data: {} });
    await consultationsApi.transitionDoctor("consultation-id", { action: "complete", outcome: "remote_care_completed", medical_record_id: "record-id", confirmation: true, expected_status: "doctor_review", client_request_id: "outcome-id" });
    expect(post).toHaveBeenCalledWith("/consultations/consultation-id/doctor-transition/", expect.objectContaining({ medical_record_id: "record-id", outcome: "remote_care_completed", confirmation: true }));
  });
});

describe("Doctor Phase C navigation and localization", () => {
  it("adds doctor record navigation without changing patient or staff navigation", () => {
    const translate = (key: string) => key;
    expect(buildNavigationItems(UserRole.DOCTOR, translate).map((item) => item.path)).toContain("/app/doctor/medical-records");
    expect(buildNavigationItems(UserRole.PATIENT, translate).map((item) => item.path)).not.toContain("/app/doctor/medical-records");
    expect(buildNavigationItems(UserRole.ADMINISTRATOR, translate).map((item) => item.path)).not.toContain("/app/doctor/medical-records");
  });

  it("contains critical record, conflict, finalization, and outcome keys in all locales", () => {
    for (const dictionary of [en, ar, ckb] as Array<Record<string, string>>) {
      for (const key of ["doctorRecords.title", "doctorRecords.tab.needs_action", "doctorRecord.patientReported", "doctorRecord.doctorAuthored", "doctorRecord.conflict", "doctorRecord.confirmFinalize", "doctorRecord.field.patient_instructions", "doctorPhaseB.action.emergency_escalate"]) {
        expect(dictionary[key], `${key} missing`).toBeTruthy();
      }
    }
  });
});
