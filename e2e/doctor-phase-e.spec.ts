import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { getBaseUrl, getDoctorCreds, login, setLocale } from "./helpers";

async function completedIntakeConsultation(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/consultations/doctor/?status=intake_completed", {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`Doctor queue failed: ${response.status}`);
    const payload = await response.json();
    return payload.results[0];
  });
}

test.describe("Doctor Phase E closure", () => {
  test("explicit intake deep route survives history navigation and passes axe", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    const consultation = await completedIntakeConsultation(page);
    const detail = `${getBaseUrl()}/app/doctor/consultations/${consultation.id}`;
    const intake = `${detail}/intake`;

    await page.goto(detail);
    await expect(page.getByRole("heading", { name: "Consultation workspace" })).toBeVisible();
    await page.goto(intake);
    await expect(page).toHaveURL(/\/consultations\/[^/]+\/intake$/);
    await expect(page.getByText(/synthetic completed intake response/i)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(detail);
    await page.goForward();
    await expect(page).toHaveURL(intake);

    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations.map(({ id }) => id)).toEqual([]);
  });

  test("doctor navigation order stays closed and browser storage has no auth token", async ({ page }) => {
    const credentials = getDoctorCreds();
    await login(page, credentials.email, credentials.password);
    await page.goto(getBaseUrl() + "/app/doctor");
    const required = [
      "/app/doctor",
      "/app/doctor/consultations",
      "/app/doctor/messages",
      "/app/doctor/medical-records",
      "/app/doctor/reviews",
      "/app/doctor/availability",
      "/app/doctor/notifications",
      "/app/doctor/profile",
      "/app/doctor/privacy",
    ];
    const doctorLinks = page.locator("a[href^='/app/doctor']");
    await expect(doctorLinks).toHaveCount(required.length);
    const links = await doctorLinks.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href"))
    );
    expect([...new Set(links)]).toEqual(required);
    const storage = await page.evaluate(() => ({
      local: Object.entries(localStorage),
      session: Object.entries(sessionStorage),
    }));
    expect(JSON.stringify(storage)).not.toMatch(/access[_-]?token|refresh[_-]?token|bearer/i);
  });

  for (const [locale, direction] of [["ar", "rtl"], ["ckb", "rtl"], ["en", "ltr"]] as const) {
    test(`${locale} intake deep route renders without raw translation keys`, async ({ page }) => {
      const credentials = getDoctorCreds();
      await login(page, credentials.email, credentials.password);
      const consultation = await completedIntakeConsultation(page);
      await setLocale(page, locale);
      await page.goto(`${getBaseUrl()}/app/doctor/consultations/${consultation.id}/intake`);
      await expect(page.locator("html")).toHaveAttribute("dir", direction);
      await expect(page.getByText(/doctorPhase[A-E]\.|doctorD\./)).toHaveCount(0);
      await expect(page.getByText(/synthetic completed intake response/i)).toBeVisible();
    });
  }
});
