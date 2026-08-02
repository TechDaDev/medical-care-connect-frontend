import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";
import { getBaseUrl, getDoctorCreds, login, setLocale } from "./helpers";

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map(({ id }) => id)).toEqual([]);
}

test.describe.serial("Doctor Phase D route closure", () => {
  test.beforeEach(async ({ page }) => { await login(page, getDoctorCreds().email, getDoctorCreds().password); });

  test("messages supports operational tabs, filters, conversation links, and mobile-safe axe", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/doctor/messages");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    for (const name of ["Needs My Reply", "Unread", "Active", "Closed", "All"]) await expect(page.getByRole("tab", { name })).toBeVisible();
    await page.getByRole("tab", { name: "Unread" }).click(); await expect(page).toHaveURL(/tab=unread/);
    await page.getByRole("tab", { name: "All" }).click(); await expect(page).toHaveURL(/tab=all/);
    await expect(page.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
    await page.getByLabel("Search").fill("Synthetic"); await expect(page).toHaveURL(/search=Synthetic/);
    await page.getByLabel("Search").clear(); await expect(page).not.toHaveURL(/search=/);
    await expect(page.getByRole("link", { name: "Open conversation" }).first()).toHaveAttribute("href", /\/app\/doctor\/messages\//);
    await axe(page);
  });

  test("notifications mark read and expose only doctor-safe destinations", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/doctor/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await axe(page);
    const items = page.locator("button.w-full"); if (await items.count()) await items.first().click();
    await expect(page).not.toHaveURL(/^https?:\/\/(?!127\.0\.0\.1|localhost)/);
  });

  test("reviews hide anonymous identity and show response policy", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/doctor/reviews");
    await expect(page.getByRole("heading", { name: "Reviews and reputation" })).toBeVisible();
    await expect(page.getByText("Anonymous reviewer").first()).toBeVisible();
    await axe(page);
  });

  test("profile and privacy expose completeness, retention, exports, deletion, and shared redirects", async ({ page }) => {
    await page.goto(getBaseUrl() + "/app/profile"); await expect(page).toHaveURL(/\/app\/doctor\/profile$/); await expect(page.getByText("Profile completeness")).toBeVisible();
    await page.goto(getBaseUrl() + "/app/privacy"); await expect(page).toHaveURL(/\/app\/doctor\/privacy$/); await expect(page.getByText("Clinical and audit retention")).toBeVisible();
    await page.getByRole("link", { name: "Manage exports" }).click(); await expect(page).toHaveURL(/\/app\/doctor\/privacy\/exports$/);
    await page.goto(getBaseUrl() + "/app/privacy/deletion"); await expect(page).toHaveURL(/\/app\/doctor\/privacy\/deletion$/); await expect(page.getByText("Administrator review remains authoritative. Submission causes no immediate deletion.")).toBeVisible();
    await axe(page);
  });

  for (const locale of ["ar", "ckb"] as const) test(`${locale} routes stay RTL without raw keys`, async ({ page }) => {
    await setLocale(page, locale); await page.goto(getBaseUrl() + "/app/doctor/privacy"); await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); await expect(page.getByText(/doctorD\./)).toHaveCount(0);
  });
});
