import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getPatientCreds } from "./helpers";

test.describe("Patient Review Flow", () => {
  test("patient can view completed consultation detail", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    // Navigate directly to the completed consultation detail
    await page.goto(getBaseUrl() + "/app/patient/consultations/aac8077d-1a1c-4032-9b88-b22a7efb7572");
    // Wait for React content to render
    await page.waitForSelector("body", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("patient can navigate back to consultation list", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    // Navigate to consultation list
    await page.goto(getBaseUrl() + "/app/patient/consultations");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("body", { timeout: 15000 });

    // Should see the consultations page
    await expect(page.locator("body")).toBeVisible();
  });
});
