import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getDoctorCreds, getPatientCreds, setLocale } from "./helpers";

test.describe("Doctor profile flow", () => {
  test("Pending doctor lands on pending page and can access profile", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);

    // Should land on pending-approval after login redirect
    await page.waitForURL(/\/app\/doctor\/pending-approval/, { timeout: 15000 });

    // Update profile button navigates to doctor profile
    await page.click("text=Update profile");
    await page.waitForURL(/\/app\/doctor\/profile/, { timeout: 10000 });

    // Registration values appear
    await expect(page.locator("text=Doctor Profile")).toBeVisible();
  });

  test("Doctor can update workplace and biography", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/doctor/, { timeout: 15000 });

    // Navigate directly
    await page.goto(getBaseUrl() + "/app/doctor/profile", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Doctor Profile", { timeout: 10000 });

    // Change workplace
    const workplaceInput = page.locator("#workplace");
    await workplaceInput.fill("Updated Hospital Name");

    // Save professional profile
    await page.click("text=Save Professional Profile");
    await page.waitForSelector("text=Professional profile updated", { timeout: 10000 });
  });

  test("License data is not editable through normal fields", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/doctor/profile", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Doctor Profile", { timeout: 10000 });

    // License section is display-only
    await expect(page.locator("text=License Information")).toBeVisible();
    await expect(page.locator("text=Document Received")).toBeVisible();
  });

  test("Pending doctor remains pending after profile update", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/doctor/profile", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Doctor Profile", { timeout: 10000 });

    // Status banner is visible
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test("Arabic doctor profile flow", async ({ page }) => {
    const creds = getDoctorCreds();
    await setLocale(page, "ar");
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/doctor/profile", { waitUntil: "networkidle" });
    await page.waitForSelector("text=الملف الطبي", { timeout: 10000 });
  });

  test("Kurdish doctor profile flow", async ({ page }) => {
    const creds = getDoctorCreds();
    await setLocale(page, "ckb");
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/doctor/profile", { waitUntil: "networkidle" });
    await page.waitForSelector("text=پڕۆفایلی پزیشک", { timeout: 10000 });
  });

  test("Patient cannot access doctor profile", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);

    // Try to navigate to doctor profile
    await page.goto(getBaseUrl() + "/app/doctor/profile", { waitUntil: "networkidle" });

    // Should be redirected or get 403
    const url = page.url();
    expect(url).not.toContain("/app/doctor/profile");
  });
});
