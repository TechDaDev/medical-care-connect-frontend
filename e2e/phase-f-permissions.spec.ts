import { expect, test, type Page } from "@playwright/test";

import {
  getAdminCreds,
  getCoordinatorCreds,
  getDoctorCreds,
  getPatientCreds,
  login,
} from "./helpers";

const staffEndpoint = "/api/staff/dashboard/";
const administratorEndpoints = [
  "/api/staff/users/",
  "/api/staff/privacy/deletion-requests/",
  "/api/staff/audit-events/",
  "/api/staff/specialties/",
  "/api/staff/attachments/",
  "/api/staff/operations/status/",
];

async function loginAs(page: Page, role: "administrator" | "coordinator" | "doctor" | "patient") {
  const credentials = {
    administrator: getAdminCreds,
    coordinator: getCoordinatorCreds,
    doctor: getDoctorCreds,
    patient: getPatientCreds,
  }[role]();
  await login(page, credentials.email, credentials.password);
}

test.describe("Phase F role and route matrix", () => {
  test("anonymous receives 401 from protected staff endpoints", async ({ request }) => {
    expect((await request.get(staffEndpoint)).status()).toBe(401);
    for (const endpoint of administratorEndpoints) {
      expect((await request.get(endpoint)).status()).toBe(401);
    }
  });

  test("administrator can load staff and administrator APIs", async ({ page }) => {
    await loginAs(page, "administrator");
    expect((await page.request.get(staffEndpoint)).status()).toBe(200);
    for (const endpoint of administratorEndpoints) {
      expect((await page.request.get(endpoint)).status()).toBe(200);
    }

    await page.goto("/app/staff/operations");
    await expect(page.getByRole("heading", { name: "Operational Status" })).toBeVisible();
    await expect(page.getByText("Total in-app notifications").first()).toBeVisible();
  });

  test("coordinator has operational staff access but no administrator APIs", async ({ page }) => {
    await loginAs(page, "coordinator");
    expect((await page.request.get(staffEndpoint)).status()).toBe(200);
    for (const endpoint of administratorEndpoints) {
      expect((await page.request.get(endpoint)).status()).toBe(403);
    }

    await page.goto("/app/staff/operations");
    await expect(page).toHaveURL(/\/app\/staff$/);
  });

  for (const role of ["doctor", "patient"] as const) {
    test(`${role} cannot access staff dashboard or routes`, async ({ page }) => {
      await loginAs(page, role);
      expect((await page.request.get(staffEndpoint)).status()).toBe(403);
      for (const endpoint of administratorEndpoints) {
        expect((await page.request.get(endpoint)).status()).toBe(403);
      }
      await page.goto("/app/staff");
      await expect(page).toHaveURL(new RegExp(`/app/${role}$`));
    });
  }
});
