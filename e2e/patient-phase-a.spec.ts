import { expect, test } from "@playwright/test";
import {
  getAdminCreds,
  getBaseUrl,
  getCoordinatorCreds,
  getDoctorCreds,
  getPatientCreds,
  login,
} from "./helpers";

test.describe("Patient Phase A dashboard", () => {
  test.beforeEach(async ({ page }) => {
    const credentials = getPatientCreds();
    await login(page, credentials.email, credentials.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Patient dashboard" }),
    ).toBeVisible();
  });

  test("renders contract sections, numeric cards, links, and refresh", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Needs your attention" }),
    ).toBeVisible();
    const summary = page.locator(
      'section[aria-labelledby="consultation-summary-heading"]',
    );
    await expect(summary.getByText("Total", { exact: true })).toBeVisible();
    await expect(summary.getByText(/^\d+$/, { exact: true }).first()).toBeVisible();

    const messageLink = page.locator(
      'a[href^="/app/patient/messages/"]',
    ).first();
    await expect(messageLink).toBeVisible();
    await expect(messageLink).toContainText("1");
    await messageLink.click();
    await expect(page).toHaveURL(/\/app\/patient\/messages\//);

    await page.goto(getBaseUrl() + "/app/patient");
    const notificationLink = page
      .locator('a[aria-label^="Open notification:"]')
      .first();
    await expect(notificationLink).toBeVisible();
    await notificationLink.click();
    await expect(page).toHaveURL(/\/app\/patient\/consultations\//);

    await page.goto(getBaseUrl() + "/app/patient");
    const recentConsultation = page
      .locator('a[aria-label^="Open consultation with"]')
      .first();
    await expect(recentConsultation).toBeVisible();
    await recentConsultation.click();
    await expect(page).toHaveURL(/\/app\/patient\/consultations\//);

    await page.goto(getBaseUrl() + "/app/patient");
    await expect(
      page.getByRole("link", { name: "Complete profile" }).first(),
    ).toHaveAttribute("href", "/app/profile");
    await expect(
      page.getByRole("link", { name: "Privacy", exact: true }),
    ).toHaveAttribute("href", "/app/privacy");

    const dashboardResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/patients/me/dashboard/") &&
        response.request().method() === "GET",
    );
    await page.getByRole("button", { name: "Refresh" }).click();
    await expect((await dashboardResponse).status()).toBe(200);
  });

  test("switches English, Arabic, and Kurdish direction without raw keys", async ({
    page,
  }) => {
    for (const [locale, direction] of [
      ["en", "ltr"],
      ["ar", "rtl"],
      ["ckb", "rtl"],
    ] as const) {
      await page.getByRole("combobox").selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("dir", direction);
      await expect(page.locator("body")).not.toContainText(
        /patientDashboard\.|consultation\.status\./,
      );
    }
  });

  test("mobile navigation and attention remain accessible", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile");

    await page.getByRole("button", { name: /Open navigation|کردنەوە|فتح/ }).click();
    await expect(page.getByRole("link", { name: /Privacy|الخصوصية|تایبەتمەندی/ })).toBeVisible();
    await expect(
      page.locator('a[href^="/app/patient/messages/"]').first(),
    ).toBeVisible();
    await expect(
      page.locator(
        'section[aria-labelledby="consultation-summary-heading"]',
      ),
    ).toBeVisible();
  });
});

test.describe("Patient route denial", () => {
  for (const [role, credentials] of [
    ["doctor", getDoctorCreds],
    ["coordinator", getCoordinatorCreds],
    ["administrator", getAdminCreds],
  ] as const) {
    test(`${role} cannot open patient dashboard`, async ({ page }) => {
      const account = credentials();
      await login(page, account.email, account.password);
      await page.goto(getBaseUrl() + "/app/patient");
      await expect(page).not.toHaveURL(/\/app\/patient\/?$/);
    });
  }

  test("anonymous user is redirected to login", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/patient");
    await expect(page).toHaveURL(/\/login/);
  });
});
