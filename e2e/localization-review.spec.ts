import { test, expect } from "@playwright/test";
import { getBaseUrl } from "./helpers";

test.describe("Review Localization", () => {
  test("review redirects unauthenticated to login", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/doctor/reviews");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("login page loads correctly", async ({ page }) => {
    const resp = await page.goto(getBaseUrl() + "/login");
    expect(resp?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("staff reviews redirects unauthenticated", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/staff/reviews");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
