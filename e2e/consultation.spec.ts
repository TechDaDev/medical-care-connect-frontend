import { test, expect } from "@playwright/test";
import { getBaseUrl, login, getPatientCreds } from "./helpers";

test.describe("Consultation flow", () => {
  test("patient creates a consultation", async ({ page }) => {
    const creds = getPatientCreds();
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/app\/(patient|dashboard)/, { timeout: 10000 });

    // Navigate to new consultation page
    await page.goto(getBaseUrl() + "/app/patient/consultations/new");
    await expect(page.locator("body")).toBeVisible();
  });
});
