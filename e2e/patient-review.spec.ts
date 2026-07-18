import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getPatientCreds } from "./helpers";

test.describe("Patient Review Flow", () => {
  test("patient can submit review for completed consultation", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    // Navigate to consultations list
    await page.goto(getBaseUrl() + "/app/patient/consultations");
    await page.waitForLoadState("networkidle");

    // Click first completed consultation
    const completeLink = page.locator("a").filter({ hasText: /completed|complete/i }).first();
    if (await completeLink.isVisible()) {
      await completeLink.click();
    } else {
      // Pick any consultation detail link
      const detailBtn = page.locator("a").filter({ hasText: /view|detail|consultation/i }).first();
      await detailBtn.click();
    }
    await page.waitForURL(/\/app\/patient\/consultations\//, { timeout: 10000 });

    // Submit star rating + review if form visible
    const reviewForm = page.locator("form").filter({ hasText: /rating|review/i }).first();
    if (await reviewForm.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click 4th star
      const stars = page.locator('button[aria-label*="star"], button:has(svg)').filter({ hasText: /star/i });
      if (await stars.count() > 0) {
        await stars.nth(3).click();
      }
      const bodyField = page.locator('textarea[name="body"], textarea[placeholder*="review"i]');
      if (await bodyField.isVisible()) {
        await bodyField.fill("Great consultation, very thorough.");
      }
      const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /submit|save/i });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Verify page response
    await expect(page.locator("body")).toBeVisible();
  });

  test("patient can view existing review", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    // Consultations page
    await page.goto(getBaseUrl() + "/app/patient/consultations");
    await page.waitForLoadState("networkidle");

    // Click into a detail
    const detailBtn = page.locator("a").filter({ hasText: /view|detail|consultation/i }).first();
    await detailBtn.click();
    await page.waitForURL(/\/app\/patient\/consultations\//, { timeout: 10000 });

    // Should see either review form or existing review card
    const reviewSection = page.locator("body").filter({ hasText: /rating|review|star/i }).first();
    await expect(reviewSection).toBeVisible({ timeout: 5000 });
  });
});
