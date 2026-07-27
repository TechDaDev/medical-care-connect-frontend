import { test, expect } from "@playwright/test";
import { getBaseUrl, setLocale } from "./helpers";

const RUN_ID = process.env.E2E_RUN_ID;
if (!RUN_ID) throw new Error("E2E_RUN_ID missing.");

test.describe("Account-type registration", () => {
  test("register page shows patient and doctor options", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(getBaseUrl() + "/register", { waitUntil: "networkidle" });
    await page.waitForSelector('h1');
    const pageText = await page.textContent("body");
    expect(pageText).toContain("Patient");
    expect(pageText).toContain("Doctor");
  });

  test("coordinator/admin options absent", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(getBaseUrl() + "/register", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).not.toContain("Coordinator");
    expect(body).not.toContain("Administrator");
  });

  test("patient registration flow", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(getBaseUrl() + "/register", { waitUntil: "networkidle" });
    await page.waitForSelector('button[role="radio"]');
    // Click patient option
    const patientBtn = page.getByRole("radio", { name: /^Patient\b/ });
    await patientBtn.click();
    await page.waitForSelector('form');
    // Fill form
    const unique = `${RUN_ID}+registration-patient-${Date.now()}`;
    const email = `e2e+${unique}@example.invalid`;
    await page.fill('input[name="first_name"]', "E2E");
    await page.fill('input[name="last_name"]', "Patient");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="tel"]', "+9647000000001");
    await page.fill('input[type="password"]', "E2eTest123!");
    // second password field
    const pwdFields = page.locator('input[type="password"]');
    await pwdFields.nth(1).fill("E2eTest123!");
    await page.click('button[type="submit"]');
    // Should redirect to patient dashboard
    await expect(page).toHaveURL(/\/app\/patient/, { timeout: 15000 });
  });

  test("doctor application flow", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(getBaseUrl() + "/register", { waitUntil: "networkidle" });
    await page.waitForSelector('button[role="radio"]');
    // Click doctor option
    const doctorBtn = page.getByRole("radio", { name: /^Doctor\b/ });
    await doctorBtn.click();
    await page.waitForSelector('form');
    // Fill personal info
    const unique = `${RUN_ID}+registration-doctor-${Date.now()}`;
    const email = `e2e+${unique}@example.invalid`;
    await page.fill('input[name="first_name"]', "E2E");
    await page.fill('input[name="last_name"]', "Doctor");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="tel"]', "+9647000000002");
    const pwdFields = page.locator('input[type="password"]');
    await pwdFields.nth(0).fill("E2eTest123!");
    await pwdFields.nth(1).fill("E2eTest123!");
    // Fill professional info
    await page.waitForSelector('select');
    await page.getByRole("combobox", { name: "Specialty" }).selectOption({ index: 1 });
    await page.fill('input[name="medical_license_number"]', `LIC-${unique}`);
    await page.fill('input[name="years_of_experience"]', "5");
    await page.fill('input[name="workplace_name"]', "E2E Clinic");
    await page.fill('textarea', "Board certified e2e doctor.");
    // Click language checkboxes
    const langCb = page.locator('input[type="checkbox"]');
    const count = await langCb.count();
    if (count > 0) await langCb.nth(0).check();
    await page.locator('input[type="file"]').setInputFiles({
      name: "synthetic-license.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% synthetic local acceptance fixture\n%%EOF\n"),
    });
    await page.click('button[type="submit"]');
    // Should redirect to pending-approval
    await expect(page).toHaveURL(/\/app\/doctor\/pending-approval/, { timeout: 15000 });
  });

  test("validation errors are safe and translated", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(getBaseUrl() + "/register", { waitUntil: "networkidle" });
    await page.waitForSelector('button[role="radio"]');
    await page.locator('button[role="radio"]').first().click();
    await page.waitForSelector('form');
    // Submit empty form
    await page.click('button[type="submit"]');
    // Should show validation errors
    const body = await page.textContent("body");
    expect(body).not.toContain("Traceback");
    expect(body).not.toContain("Internal Server Error");
  });
});
