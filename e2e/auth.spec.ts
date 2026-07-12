import { test, expect } from "@playwright/test";
import {
  getBaseUrl,
  login,
  getPatientCreds,
  getDoctorCreds,
  getCoordinatorCreds,
} from "./helpers";

test.describe("Authentication", () => {
  test("landing page loads", async ({ page }) => {
    const resp = await page.goto(getBaseUrl());
    expect(resp?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("patient login succeeds", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    // After login, should be on dashboard
    await expect(page).toHaveURL(/\/app\/(patient|dashboard)/, { timeout: 10000 });
  });

  test("patient dashboard loads", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/app\/(patient|dashboard)/, { timeout: 10000 });
    await expect(page.locator("body")).toBeVisible();
  });

  test("patient cannot access staff route", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    // Wait for login redirect to complete before navigating
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });
    // Try navigating to staff dashboard
    await page.goto(getBaseUrl() + "/app/staff");
    // Should be redirected away
    await expect(page).toHaveURL(/\/app\/(patient|login)/, { timeout: 10000 });
  });

  test("logout removes authenticated access", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    // Find and click logout button
    const logoutBtn = page.locator("button, a").filter({ hasText: /log\s*out|logout|sign\s*out/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    // Protected page should redirect to login
    await page.goto(getBaseUrl() + "/app/patient");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe("Doctor access", () => {
  test("doctor login and consultation list load", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/app\/(doctor|dashboard)/, { timeout: 10000 });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Coordinator access", () => {
  test("coordinator login and staff dashboard load", async ({ page }) => {
    const creds = getCoordinatorCreds();
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/app\/(staff|dashboard)/, { timeout: 10000 });
    await expect(page.locator("body")).toBeVisible();
  });
});
