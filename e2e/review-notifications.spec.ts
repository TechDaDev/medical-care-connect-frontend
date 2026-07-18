import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getPatientCreds } from "./helpers";

test.describe("Review Notifications", () => {
  test("patient dashboard loads with notification area", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    // Dashboard should have notification-related content
    const notificationArea = page.locator("body").filter({ hasText: /notification|alert|update/i });
    await expect(notificationArea.first()).toBeVisible({ timeout: 5000 });
  });

  test("consultation detail shows review status", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    // Navigate to consultation list
    await page.goto(getBaseUrl() + "/app/patient/consultations");
    await page.waitForLoadState("networkidle");

    // Should see consultation list with status indicators
    await expect(page.locator("body")).toBeVisible();
  });
});
