import { expect, Page, test } from "@playwright/test";
import {
  getBaseUrl,
  getDoctorCreds,
  getPatientCreds,
  login,
} from "./helpers";

async function createSyntheticConsultation(page: Page): Promise<string> {
  await page.goto(getBaseUrl() + "/app/patient/doctors");
  const doctor = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: /Synthetic Approved/ }),
  });
  await doctor.getByRole("link", { name: "Start consultation" }).click();
  await page.getByLabel("Reason for consultation").fill(
    "Synthetic lifecycle verification with enough detail for safe local testing.",
  );
  await page.getByRole("button", { name: "Review consultation" }).click();
  await page.getByRole("button", { name: "Submit consultation" }).click();
  await page.waitForURL(/\/app\/patient\/consultations\/[0-9a-f-]+$/);
  return page.url().split("/").pop()!;
}

test.describe("Patient Phase C consultation lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    const credentials = getPatientCreds();
    await login(page, credentials.email, credentials.password);
  });

  test("server list supports tabs, URL filters, safe cards, and detail timeline", async ({
    page,
  }) => {
    const consultationId = await createSyntheticConsultation(page);
    await page.goto(getBaseUrl() + "/app/patient/consultations");

    await expect(page.getByRole("tab", { name: "Active" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByLabel("Search").fill(consultationId);
    await expect(page).toHaveURL(new RegExp(`search=${consultationId}`));
    await page
      .getByLabel("Unread messages only")
      .evaluate((input: HTMLInputElement) => input.click());
    await expect(page).toHaveURL(/unread=true/);
    await page
      .getByLabel("Unread messages only")
      .evaluate((input: HTMLInputElement) => input.click());
    await expect(page).not.toHaveURL(/unread=true/);

    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page.getByRole("heading", { name: "Consultation Details" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Consultation timeline" })).toBeVisible();
    await expect(page.locator('[aria-label="Submitted"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel consultation" })).toBeVisible();
  });

  test("cancellation validates reason and updates authoritative detail", async ({ page }) => {
    await createSyntheticConsultation(page);
    await page.getByRole("button", { name: "Cancel consultation" }).click();
    const reason = page.getByLabel("Cancellation reason");
    await reason.fill("short");
    await expect(page.getByRole("button", { name: "Confirm" })).toBeDisabled();
    await reason.fill("Synthetic cancellation requested for lifecycle verification.");
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByLabel("Cancelled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel consultation" })).toHaveCount(0);
  });

  test("doctor cannot enter patient consultation route", async ({ page }) => {
    const consultationId = await createSyntheticConsultation(page);
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + `/app/patient/consultations/${consultationId}`);
    await expect(page).not.toHaveURL(
      new RegExp(`/app/patient/consultations/${consultationId}$`),
    );
  });

  test("English, Arabic, and Kurdish preserve direction and mobile timeline", async ({
    page,
  }) => {
    await createSyntheticConsultation(page);
    for (const [locale, direction] of [
      ["ar", "rtl"],
      ["ckb", "rtl"],
      ["en", "ltr"],
    ] as const) {
      await page.getByRole("banner").getByRole("combobox").selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("dir", direction);
      await expect(page.getByRole("list")).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/phaseC\.|timeline\./);
    }
  });
});
