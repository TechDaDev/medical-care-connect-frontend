import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";
import {
  getBaseUrl,
  getDoctorCreds,
  getMissingProfileDoctorCreds,
  getPendingDoctorCreds,
  getRejectedDoctorCreds,
  getSuspendedDoctorCreds,
  login,
  setLocale,
} from "./helpers";

async function assertNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map(({ target }) => target),
    })),
  ).toEqual([]);
}

test.describe("Doctor Phase A access, dashboard, and availability", () => {
  test("approved doctor routes to rich authoritative dashboard", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await page.waitForURL(/\/app\/doctor\/?$/);
    await expect(page.getByRole("heading", { name: /Welcome, Synthetic Approved/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent consultations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Manage availability" })).toHaveAttribute(
      "href",
      "/app/doctor/availability",
    );
    await assertNoAxeViolations(page);
  });

  for (const [name, credentials, path, heading] of [
    ["pending", getPendingDoctorCreds, /pending-approval/, "Application under review"],
    ["rejected", getRejectedDoctorCreds, /application-rejected/, "Application not approved"],
    ["suspended", getSuspendedDoctorCreds, /suspended/, "Doctor access suspended"],
    ["missing-profile", getMissingProfileDoctorCreds, /profile-missing/, "Doctor profile unavailable"],
  ] as const) {
    test(`${name} doctor receives dedicated safe access page`, async ({ page }) => {
      const account = credentials();
      await login(page, account.email, account.password);
      await page.waitForURL(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
      await expect(page.getByText(/patient/i)).toHaveCount(name === "suspended" ? 1 : 0);
      await assertNoAxeViolations(page);
    });
  }

  test("pending doctor cannot call dashboard or availability APIs directly", async ({ page }) => {
    const credentials = getPendingDoctorCreds();
    await login(page, credentials.email, credentials.password);
    const statuses = await page.evaluate(async () => {
      const dashboard = await fetch("/api/doctors/me/dashboard/", { credentials: "include" });
      const availability = await fetch("/api/doctors/me/availability/", { credentials: "include" });
      return [dashboard.status, availability.status];
    });
    expect(statuses).toEqual([403, 403]);
  });

  test("doctor manages recurring weekly availability and restores fixture", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + "/app/doctor/availability");
    await expect(page.getByRole("heading", { name: "Availability", exact: true })).toBeVisible();
    await expect(page.getByText("Monday")).toBeVisible();

    await page.getByRole("button", { name: "Add availability" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add availability" });
    await dialog.getByLabel("Weekday").selectOption("friday");
    await dialog.getByLabel("Start time").fill("10:00");
    await dialog.getByLabel("End time").fill("11:00");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Friday")).toBeVisible();

    const fridayCard = page.getByRole("listitem").filter({ hasText: "Friday" });
    await fridayCard.getByRole("button", { name: "Edit" }).click();
    const editDialog = page.getByRole("dialog", { name: "Edit availability" });
    await editDialog.getByLabel("End time").fill("11:30");
    await editDialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("10:00–11:30")).toBeVisible();

    await page.getByRole("listitem").filter({ hasText: "Friday" }).getByRole("button", { name: "Delete" }).click();
    const deleteDialog = page.getByRole("dialog", { name: "Delete availability" });
    await deleteDialog.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Friday")).toHaveCount(0);
    await assertNoAxeViolations(page);
  });

  test("accepting switch is semantic, authoritative, and stale-safe", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + "/app/doctor/availability");
    const toggle = page.getByRole("switch", { name: "Accepting new consultations" });
    const initial = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !initial });
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: initial });

    const staleStatus = await page.evaluate(async (original) => {
      const access = await fetch("/api/doctors/me/access-state/", { credentials: "include" }).then((r) => r.json());
      await fetch("/api/doctors/me/availability-status/", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": document.cookie.match(/mcc_csrftoken=([^;]+)/)?.[1] || "" },
        body: JSON.stringify({ is_accepting_consultations: !original }),
      });
      const stale = await fetch("/api/doctors/me/availability-status/", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": document.cookie.match(/mcc_csrftoken=([^;]+)/)?.[1] || "" },
        body: JSON.stringify({
          is_accepting_consultations: original,
          expected_updated_at: access.updated_at,
        }),
      });
      await fetch("/api/doctors/me/availability-status/", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": document.cookie.match(/mcc_csrftoken=([^;]+)/)?.[1] || "" },
        body: JSON.stringify({ is_accepting_consultations: original }),
      });
      return stale.status;
    }, initial);
    expect(staleStatus).toBe(409);
  });

  test("Arabic dashboard and availability use RTL", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await setLocale(page, "ar");
    await page.goto(getBaseUrl() + "/app/doctor");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: /مرحباً/ })).toBeVisible();
    await page.goto(getBaseUrl() + "/app/doctor/availability");
    await expect(page.getByRole("heading", { name: "التوفر", exact: true })).toBeVisible();
  });
});
