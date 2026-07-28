import { expect, test } from "@playwright/test";
import { getBaseUrl, getPatientCreds, login } from "./helpers";

test.describe("Patient Phase D account and records", () => {
  test.beforeEach(async ({ page }) => {
    const credentials = getPatientCreds();
    await login(page, credentials.email, credentials.password);
  });

  test("profile tabs save authoritative patient data", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/patient/profile");
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Profile completion" })).toBeVisible();
    await page.getByRole("tab", { name: "Emergency contact" }).click();
    await page.getByLabel("Emergency contact name").fill(
      `Synthetic Contact ${page.viewportSize()?.width || "browser"}`,
    );
    await page.getByLabel("Emergency contact phone").fill("+9647701234567");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Profile saved." })).toBeVisible();
  });

  test("record list and detail expose patient-safe fields", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/patient/medical-records");
    await expect(page.getByRole("heading", { name: "Medical Records" })).toBeVisible();
    await page.getByRole("link", { name: "View record" }).click();
    await expect(page.getByRole("heading", { name: "Medical Record" })).toBeVisible();
    await expect(page.getByText("synthetic patient-visible record")).toBeVisible();
    await expect(page.getByText("Internal synthetic note")).toHaveCount(0);
  });

  test("messages, notifications, and privacy use patient routes", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/patient/messages");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByText("synthetic incoming message")).toBeVisible();

    await page.goto(getBaseUrl() + "/app/patient/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("button", { name: /patient dashboard notification/i })).toBeVisible();

    await page.goto(getBaseUrl() + "/app/patient/privacy");
    await expect(page.getByRole("heading", { name: "Privacy and Data" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Manage data exports" })).toHaveAttribute(
      "href",
      "/app/patient/privacy/exports",
    );
  });

  test("Arabic and Kurdish remain RTL without untranslated Phase D keys", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/patient/profile");
    for (const locale of ["ar", "ckb"]) {
      await page.getByRole("banner").getByRole("combobox").selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.getByRole("main")).not.toContainText(
        /patient(Profile|Records|Messages|Privacy)\.|notification\.(empty|markAllRead|unreadOnly)/,
      );
    }
  });
});
