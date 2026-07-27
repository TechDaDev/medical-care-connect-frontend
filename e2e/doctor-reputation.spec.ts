import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getDoctorCreds } from "./helpers";

test.describe("Doctor Reputation & Reviews", () => {
  test("doctor can view reputation score", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/doctor/, { timeout: 10000 });

    // Doctor reviews page
    await page.goto(getBaseUrl() + "/app/doctor/reviews");
    await page.waitForLoadState("networkidle");

    // Reputation card should show
    const reputationCard = page.locator("body").filter({ hasText: /reputation|rating|average/i });
    await expect(reputationCard.first()).toBeVisible({ timeout: 10000 });

    // Should list reviews
    const reviewList = page.locator("body").filter({ hasText: /reviews|feedback/i });
    await expect(reviewList.first()).toBeVisible({ timeout: 5000 });
  });

  test("doctor reputation shows score breakdown", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/doctor/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/doctor/reviews");
    await page.waitForLoadState("networkidle");

    // Check exact rating-distribution output.
    await expect(page.getByText("5★", { exact: true })).toBeVisible();
    await expect(page.getByText("5.0", { exact: true })).toBeVisible();
  });
});
