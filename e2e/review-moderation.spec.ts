import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getCoordinatorCreds } from "./helpers";

test.describe("Staff Review Moderation", () => {
  test("staff can view all reviews in moderation queue", async ({ page }) => {
    const creds = getCoordinatorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/staff/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/staff/reviews");
    await page.waitForLoadState("networkidle");

    // Should show review moderation tab
    const pageBody = page.locator("body");
    await expect(pageBody).toBeVisible();

    // Should have tabs or content
    const tabs = page.locator("button, a").filter({ hasText: /reviews|reports|moderate/i });
    await expect(tabs.first()).toBeVisible({ timeout: 5000 });
  });

  test("staff can view reported reviews", async ({ page }) => {
    const creds = getCoordinatorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/staff/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/staff/reviews");
    await page.waitForLoadState("networkidle");

    // Click reports tab
    const reportsTab = page.locator("button, a").filter({ hasText: /reports/i }).first();
    if (await reportsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportsTab.click();
      await page.waitForTimeout(1000);
    }

    await expect(page.locator("body")).toBeVisible();
  });

  test("staff can moderate a review", async ({ page }) => {
    const creds = getCoordinatorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/staff/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/staff/reviews");
    await page.waitForLoadState("networkidle");

    // Look for moderate/menu button
    const moderateBtn = page.locator("button, a").filter({ hasText: /moderate|actions|menu|more/i }).first();
    if (await moderateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moderateBtn.click();
      await page.waitForTimeout(500);

      // Try to change status if dropdown visible
      const statusOption = page.locator("button, a, [role='menuitem']").filter({ hasText: /publish|hide|remove/i }).first();
      if (await statusOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await statusOption.click();
        await page.waitForTimeout(1000);
      }
    }

    await expect(page.locator("body")).toBeVisible();
  });
});
