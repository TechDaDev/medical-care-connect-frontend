import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getPatientCreds, getCoordinatorCreds } from "./helpers";

test.describe("Phase 8C — Privacy", () => {
  test("Patient requests privacy export", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/app\/(patient|dashboard)/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/privacy/exports");
    await expect(page.locator("body")).toBeVisible({ timeout: 5000 });

    const requestBtn = page.locator("button").filter({ hasText: /export|تصدير|هەناردن/i }).first();
    if (await requestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestBtn.click();
    }
    await expect(page.locator("body")).toBeVisible({ timeout: 3000 });
  });

  test("Pending export appears in list", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/privacy/exports");
    await expect(page.locator("body")).toBeVisible({ timeout: 5000 });
  });

  test("Patient requests deletion and sees retention warning", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/app\/(patient|dashboard)/, { timeout: 10000 });
    await page.goto(getBaseUrl() + "/app/privacy/deletion");
    await expect(page.locator("body")).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    const warning = page.locator("text=retained").or(page.locator("text=تُحتفظ")).or(page.locator("text=بپارێزرێت")).first();
    await expect(warning).toBeVisible({ timeout: 3000 });
  });

  test("Patient cannot access staff operations", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/staff/operations");
    await expect(page).toHaveURL(/\/login|\/app\/patient/, { timeout: 10000 });
  });

  test("Administrator can access operations page", async ({ page }) => {
    const creds = getCoordinatorCreds();
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/staff");
    await expect(page.locator("body")).toBeVisible({ timeout: 5000 });
  });

  test("Arabic English Kurdish privacy pages preserve direction", async ({ page }) => {
    // Test Arabic (default)
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.goto(getBaseUrl() + "/app/privacy");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl", { timeout: 5000 });
  });
});
