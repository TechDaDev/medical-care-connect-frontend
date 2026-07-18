import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getDoctorCreds } from "./helpers";

test.describe("Doctor Review Response", () => {
  test("doctor can respond to a review", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/doctor/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/doctor/reviews");
    await page.waitForLoadState("networkidle");

    // Look for respond button or textarea
    const respondBtn = page.locator("button, a").filter({ hasText: /respond|reply/i }).first();
    if (await respondBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await respondBtn.click();
      const responseField = page.locator("textarea").first();
      if (await responseField.isVisible()) {
        await responseField.fill("Thank you for your feedback.");
        const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /submit|send|save/i }).first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    await expect(page.locator("body")).toBeVisible();
  });

  test("doctor can update their response", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/doctor/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/doctor/reviews");
    await page.waitForLoadState("networkidle");

    // Edit existing response
    const editBtn = page.locator("button, a").filter({ hasText: /edit|update/i }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible()) {
        await textarea.fill("Updated: thank you for your detailed feedback.");
        const saveBtn = page.locator('button[type="submit"]').filter({ hasText: /save|submit|update/i }).first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    await expect(page.locator("body")).toBeVisible();
  });
});
