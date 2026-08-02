import { expect, test } from "@playwright/test";
import {
  getBaseUrl,
  getDoctorCreds,
  getPatientCreds,
  login,
  setLocale,
} from "./helpers";

test.describe("Patient Phase B discovery", () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(getBaseUrl() + "/doctors");
    await expect(page.getByRole("heading", { name: "Find a Doctor" })).toBeVisible();
  });

  test("shows only eligible public doctors with safe cards, filters, detail, and unavailable state", async ({
    page,
  }, testInfo) => {
    await expect(page.getByRole("heading", { name: /Synthetic Approved/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Synthetic Pending/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Synthetic Suspended/ })).toHaveCount(0);
    await expect(page.getByText(/e2e-.*synthetic qualification/)).toHaveCount(0);

    await page.getByLabel("Search doctors").fill("Approved Doctor");
    await expect(page).toHaveURL(/search=Approved(?:\+|%20)Doctor/);
    await expect(page.getByRole("heading", { name: /Synthetic Approved/ })).toBeVisible();

    await page.getByLabel("Search doctors").fill("");
    await expect(page).not.toHaveURL(/search=/);
    if (testInfo.project.name === "chromium-mobile") {
      await page.getByRole("button", { name: "Filters" }).click();
    }
    await page.getByLabel("Availability").selectOption("false");
    await expect(page.getByRole("heading", { name: /Synthetic Unavailable/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Synthetic Approved/ })).toHaveCount(0);

    const unavailableCard = page
      .getByRole("heading", { name: /Synthetic Unavailable/ })
      .locator("xpath=ancestor::article");
    await unavailableCard.getByRole("link", { name: "View profile" }).click();
    await expect(page.getByRole("heading", { name: /Synthetic Unavailable/ })).toBeVisible();
    await expect(page.getByText("Consultations unavailable")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start consultation" })).toHaveCount(0);
  });

  test("preserves filters in URL and localizes English, Arabic, and Kurdish", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "chromium-mobile") {
      await page.getByRole("button", { name: "Filters" }).click();
    }
    await page.getByLabel("Minimum years of experience").fill("5");
    await page.getByLabel("Maximum fee").fill("100");
    await page.getByLabel("Sort by").selectOption("experience_desc");
    await expect(page).toHaveURL(/min_experience=5/);
    await expect(page).toHaveURL(/max_fee=100/);
    await expect(page).toHaveURL(/ordering=experience_desc/);

    for (const [locale, direction] of [
      ["ar", "rtl"],
      ["ckb", "rtl"],
      ["en", "ltr"],
    ] as const) {
      await page.getByRole("banner").getByRole("combobox").selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("dir", direction);
      await expect(page.locator("body")).not.toContainText(/doctor\.|consultation\./);
    }
  });

  test("mobile filter drawer opens and restores keyboard focus", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile");
    const trigger = page.getByRole("button", { name: "Filters" });
    await trigger.focus();
    await trigger.click();
    await expect(page.getByLabel("Availability")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(trigger).toBeFocused();
  });
});

test.describe("Patient Phase B consultation creation", () => {
  test("requires doctor context", async ({ page }) => {
    const credentials = getPatientCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + "/app/patient/consultations/new");
    await expect(page.getByText("Choose a doctor before starting a consultation.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Choose a doctor" })).toHaveAttribute("href", "/app/patient/doctors");
  });

  test("uses authoritative doctor specialty, confirms, and sends once", async ({ page }) => {
    const credentials = getPatientCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + "/app/patient/doctors");
    const approvedCard = page.getByRole("article").filter({ has: page.getByRole("heading", { name: /Synthetic Approved/ }) });
    await approvedCard.getByRole("link", { name: "Start consultation" }).click();

    await expect(page).toHaveURL(/\/app\/patient\/consultations\/new\?doctor=/);
    await expect(page.getByRole("heading", { name: /Synthetic Approved/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Synthetic Approved/ }).locator("..").getByText(/Synthetic Medicine/)).toBeVisible();
    await expect(page.getByRole("combobox", { name: /specialty/i })).toHaveCount(0);

    await page.getByLabel("Reason for consultation").fill(
      "I have persistent symptoms and need guidance about appropriate next steps.",
    );
    await page.getByRole("button", { name: "Review consultation" }).click();
    await expect(page.getByRole("heading", { name: "Review your consultation" })).toBeVisible();

    let createRequests = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/consultations/")) {
        createRequests += 1;
      }
    });
    const responsePromise = page.waitForResponse(
      (response) => response.request().method() === "POST" && response.url().endsWith("/api/consultations/"),
    );
    await page.getByRole("button", { name: "Submit consultation" }).click({ clickCount: 2 });
    expect((await responsePromise).status()).toBe(201);
    await expect(page).toHaveURL(/\/app\/patient\/consultations\/[0-9a-f-]+$/);
    expect(createRequests).toBe(1);
  });

  test("doctor role never sees patient creation action", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + "/doctors");
    await expect(page.getByRole("heading", { name: /Synthetic Approved/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start consultation" })).toHaveCount(0);
  });
});
