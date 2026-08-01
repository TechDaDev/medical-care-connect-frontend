import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";
import { getBaseUrl, getDoctorCreds, getPatientCreds, login, setLocale } from "./helpers";

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map(({ id }) => id)).toEqual([]);
}

async function doctorConsultation(page: Page, status: string) {
  return page.evaluate(async (wanted) => {
    const response = await fetch(`/api/consultations/doctor/?status=${wanted}`, { credentials: "include" });
    if (!response.ok) throw new Error(`Doctor queue failed: ${response.status}`);
    const data = await response.json();
    return data.results[0];
  }, status);
}

test.describe("Doctor Phase B queue and workspace", () => {
  test("approved doctor sees safe responsive queue, tabs, filters, and ordering", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + "/app/doctor/consultations");
    await expect(page.getByRole("heading", { name: "Consultation queue" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Status group" })).toBeVisible();
    await page.getByRole("button", { name: "Needs action", exact: true }).click();
    await expect(page).toHaveURL(/status_group=needs_action/);
    await page.getByLabel("Priority").selectOption("urgent");
    await expect(page).toHaveURL(/priority=urgent/);
    await page.getByLabel("Unread messages only").click();
    await expect(page).toHaveURL(/has_unread_messages=true/);
    await page.getByLabel("Completed intake only").click();
    await expect(page).toHaveURL(/has_completed_intake=true/);
    await page.getByLabel("Search").fill("Synthetic");
    await expect(page).toHaveURL(/search=Synthetic/);
    await axe(page);
  });

  test("workspace renders safe summary, timeline, intake, actions, and no record dead route", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    const consultation = await doctorConsultation(page, "intake_completed");
    await page.goto(`${getBaseUrl()}/app/doctor/consultations/${consultation.id}`);
    await expect(page.getByRole("heading", { name: "Consultation workspace" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Patient intake" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Consultation timeline" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Messages" })).toHaveAttribute("href", `/app/doctor/messages/${consultation.id}`);
    await expect(page.locator('a[href*="medical-record"]')).toHaveCount(0);
    await page.getByRole("button", { name: "View", exact: true }).click();
    await expect(page.getByText(/synthetic completed intake response/i)).toBeVisible();
    await axe(page);
  });

  test("emergency and attachment states stay server-authoritative", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    const emergency = await doctorConsultation(page, "emergency_escalated");
    await page.goto(`${getBaseUrl()}/app/doctor/consultations/${emergency.id}`);
    await expect(page.getByRole("alert")).toContainText("Emergency signal detected");
    const completed = await doctorConsultation(page, "completed");
    await page.goto(`${getBaseUrl()}/app/doctor/consultations/${completed.id}`);
    await expect(page.getByText("synthetic-clean.txt")).toBeVisible();
    await expect(page.getByText("synthetic-quarantined.txt")).toBeVisible();
    await expect(page.getByText("synthetic-rejected.txt")).toBeVisible();
    await expect(page.getByRole("button", { name: /upload/i })).toHaveCount(0);
  });

  test("accept is stale-safe and internal note remains patient-invisible", async ({ page }) => {
    const patient = getPatientCreds();
    await login(page, patient.email, patient.password);
    const created = await page.evaluate(async () => {
      const csrf = document.cookie.match(/mcc_csrftoken=([^;]+)/)?.[1] || "";
      const doctors = await fetch("/api/doctors/?accepting=true", { credentials: "include" }).then((r) => r.json());
      const response = await fetch("/api/consultations/", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
        body: JSON.stringify({
          doctor: doctors.results[0].id,
          description: "Synthetic Phase B acceptance fixture without medical narrative.",
          client_request_id: crypto.randomUUID(),
        }),
      });
      if (!response.ok) throw new Error(`Create failed: ${response.status}`);
      return response.json();
    });
    await page.context().clearCookies();
    const doctor = getDoctorCreds();
    await login(page, doctor.email, doctor.password);
    await page.goto(`${getBaseUrl()}/app/doctor/consultations/${created.id}`);
    await page.getByRole("button", { name: "Accept consultation" }).click();
    const dialog = page.getByRole("dialog", { name: "Accept consultation" });
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
    const staleStatus = await page.evaluate(async (id) => {
      const csrf = document.cookie.match(/mcc_csrftoken=([^;]+)/)?.[1] || "";
      return fetch(`/api/consultations/${id}/accept/`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
        body: JSON.stringify({ expected_status: "submitted", client_request_id: crypto.randomUUID() }),
      }).then((r) => r.status);
    }, created.id);
    expect(staleStatus).toBe(409);
    const note = "Synthetic private workspace note";
    await page.getByLabel(/Add internal note/).fill(note);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(note)).toBeVisible();
    await page.context().clearCookies();
    await login(page, patient.email, patient.password);
    await page.goto(`${getBaseUrl()}/app/patient/consultations/${created.id}`);
    await expect(page.getByText(note)).toHaveCount(0);
  });

  for (const [locale, heading] of [["ar", "قائمة الاستشارات"], ["ckb", "ڕیزی ڕاوێژکارییەکان"]] as const) {
    test(`${locale} queue uses RTL and translated Phase B labels`, async ({ page }) => {
      const credentials = getDoctorCreds();
      await login(page, credentials.email, credentials.password);
      await setLocale(page, locale);
      await page.goto(getBaseUrl() + "/app/doctor/consultations");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByText(/doctorPhaseB\./)).toHaveCount(0);
    });
  }
});
