import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";
import { getBaseUrl, getPatientCreds, login } from "./helpers";

async function assertNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map(({ target }) => target),
    })),
  ).toEqual([]);
}

test.describe("Patient Phase E accessibility and session acceptance", () => {
  test("login page has no automated WCAG A or AA violations", async ({ page }) => {
    await page.goto(getBaseUrl() + "/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await assertNoAxeViolations(page);
  });

  test("browser storage never contains bearer or refresh tokens", async ({ page }) => {
    const credentials = getPatientCreds();
    await login(page, credentials.email, credentials.password);
    const storage = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
      readableCookies: document.cookie,
    }));
    const serialized = JSON.stringify(storage);
    expect(serialized).not.toMatch(/mcc_access|mcc_refresh|bearer|refresh_token/i);
    expect(storage.readableCookies).toContain("mcc_csrftoken=");
  });

  const patientPages = [
    ["/app/patient", "Patient dashboard"],
    ["/app/patient/doctors", "Find a Doctor"],
    ["/app/patient/consultations", "My Consultations"],
    ["/app/patient/profile", "My Profile"],
    ["/app/patient/medical-records", "Medical Records"],
    ["/app/patient/messages", "Messages"],
    ["/app/patient/notifications", "Notifications"],
    ["/app/patient/privacy", "Privacy and Data"],
  ] as const;

  for (const [path, heading] of patientPages) {
    test(`${heading} has no automated WCAG A or AA violations`, async ({ page }) => {
      const credentials = getPatientCreds();
      await login(page, credentials.email, credentials.password);
      await page.goto(getBaseUrl() + path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await assertNoAxeViolations(page);
    });
  }
});
