import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getPatientCreds, getDoctorCreds, getCoordinatorCreds } from "./helpers";

test.describe("Review Permissions", () => {
  test("patient cannot access staff review moderation", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/staff/reviews");
    await page.waitForLoadState("networkidle");

    // Should be redirected away
    await expect(page).toHaveURL(/\/app\/(patient|login)/, { timeout: 10000 });
  });

  test("doctor cannot access staff review moderation", async ({ page }) => {
    const creds = getDoctorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/doctor/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/staff/reviews");
    await page.waitForLoadState("networkidle");

    // Should be redirected away
    await expect(page).toHaveURL(/\/app\/(doctor|login)/, { timeout: 10000 });
  });

  test("patient cannot access doctor review management", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/patient/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/doctor/reviews");
    await page.waitForLoadState("networkidle");

    // Should be redirected away
    await expect(page).toHaveURL(/\/app\/(patient|login)/, { timeout: 10000 });
  });

  test("staff can access review moderation", async ({ page }) => {
    const creds = getCoordinatorCreds();
    await login(page, creds.email, creds.password);
    await page.waitForURL(/\/app\/staff/, { timeout: 10000 });

    await page.goto(getBaseUrl() + "/app/staff/reviews");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/app\/staff\/reviews/, { timeout: 10000 });
    await expect(page.locator("body")).toBeVisible();
  });
});
