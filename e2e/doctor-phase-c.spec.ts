import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";
import { getBaseUrl, getDoctorCreds, getPatientCreds, login, setLocale } from "./helpers";

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map(({ id }) => id)).toEqual([]);
}

async function doctorRecord(page: Page, status: "draft" | "finalized") {
  return page.evaluate(async (recordStatus) => {
    const response = await fetch(`/api/doctors/me/medical-records/?record_status=${recordStatus}`, { credentials: "include" });
    if (!response.ok) throw new Error(`Record list failed: ${response.status}`);
    const data = await response.json();
    return data.results[0];
  }, status);
}

test.describe.serial("Doctor Phase C medical records", () => {
  test("record list is responsive, URL-filtered, localized, and narrative-free", async ({ page }) => {
    await login(page, getDoctorCreds().email, getDoctorCreds().password);
    await page.goto(getBaseUrl() + "/app/doctor/medical-records");
    await expect(page.getByRole("heading", { name: "Medical records" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Medical record groups" })).toBeVisible();
    await page.getByRole("button", { name: "Drafts" }).click();
    await expect(page).toHaveURL(/tab=draft/);
    await page.getByLabel("Search").fill("Synthetic");
    await expect(page).toHaveURL(/search=Synthetic/);
    await expect(page.getByText("Synthetic draft assessment.")).toHaveCount(0);
    await axe(page);
  });

  test("editor keeps patient data read-only, saves changed fields, and preserves stale input", async ({ page }) => {
    await login(page, getDoctorCreds().email, getDoctorCreds().password);
    const record = await doctorRecord(page, "draft");
    await page.goto(`${getBaseUrl()}/app/doctor/medical-records/${record.id}`);
    await expect(page.getByRole("heading", { name: "Medical record" })).toBeVisible();
    await expect(page.getByText("Read-only source information. Verify before clinical use.")).toBeVisible();
    const assessment = page.getByLabel(/Assessment/);
    await assessment.fill("Synthetic Phase C saved assessment.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText(/Last saved/)).toBeVisible();

    const serverUpdateStatus = await page.evaluate(async (recordId) => {
      const csrf = document.cookie.match(/mcc_csrftoken=([^;]+)/)?.[1] || "";
      const current = await fetch(`/api/doctors/me/medical-records/${recordId}/`, { credentials: "include" }).then((response) => response.json());
      return fetch(`/api/doctors/me/medical-records/${recordId}/`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
        body: JSON.stringify({ doctor_authored: { assessment: "Synthetic concurrent assessment." }, expected_version: current.version, client_request_id: crypto.randomUUID() }),
      }).then((response) => response.status);
    }, record.id);
    expect(serverUpdateStatus).toBe(200);
    await assessment.fill("Synthetic local text preserved after conflict.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Record changed by another user" })).toBeFocused();
    await expect(assessment).toHaveValue("Synthetic local text preserved after conflict.");
    await axe(page);
  });

  test("authoritative reload, explicit finalization, and immutable view work", async ({ page }) => {
    await login(page, getDoctorCreds().email, getDoctorCreds().password);
    const record = await doctorRecord(page, "draft");
    await page.goto(`${getBaseUrl()}/app/doctor/medical-records/${record.id}`);
    const assessment = page.getByLabel(/Assessment/);
    await assessment.fill("Synthetic stale text for reload.");
    const currentVersion = await page.evaluate(async (recordId) => fetch(`/api/doctors/me/medical-records/${recordId}/`, { credentials: "include" }).then((response) => response.json()).then((value) => value.version), record.id);
    await page.evaluate(async ({ recordId, currentVersion }) => {
      const csrf = document.cookie.match(/mcc_csrftoken=([^;]+)/)?.[1] || "";
      await fetch(`/api/doctors/me/medical-records/${recordId}/`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", "X-CSRFToken": csrf }, body: JSON.stringify({ doctor_authored: { assessment: "Synthetic authoritative assessment." }, expected_version: currentVersion, client_request_id: crypto.randomUUID() }) });
    }, { recordId: record.id, currentVersion });
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.getByRole("button", { name: "Reload authoritative record" }).click();
    await expect(assessment).toHaveValue("Synthetic authoritative assessment.");
    await page.getByRole("button", { name: "Finalize record" }).click();
    const dialog = page.getByRole("dialog", { name: "Confirm finalization" });
    await expect(dialog).toContainText("Finalization is permanent");
    await dialog.getByRole("checkbox").check();
    await axe(page);
    await dialog.getByRole("button", { name: "Finalize record" }).click();
    await expect(page.getByText(/· Finalized/)).toBeVisible();
    await expect(assessment).toBeDisabled();
  });

  test("patient sees finalized safe projection without private fields", async ({ page }) => {
    await login(page, getDoctorCreds().email, getDoctorCreds().password);
    const record = await doctorRecord(page, "finalized");
    await page.context().clearCookies();
    await login(page, getPatientCreds().email, getPatientCreds().password);
    await page.goto(`${getBaseUrl()}/app/patient/medical-records/${record.id}`);
    await expect(page.getByRole("heading", { name: /Medical record/i })).toBeVisible();
    await expect(page.getByText(/private doctor notes/i)).toHaveCount(0);
    await expect(page.getByText(/AI suggestions/i)).toHaveCount(0);
  });

  for (const locale of ["ar", "ckb"] as const) {
    test(`${locale} record list is RTL with translated labels`, async ({ page }) => {
      await login(page, getDoctorCreds().email, getDoctorCreds().password);
      await setLocale(page, locale);
      await page.goto(getBaseUrl() + "/app/doctor/medical-records");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.getByText(/doctorRecords\.|doctorRecord\./)).toHaveCount(0);
    });
  }
});
