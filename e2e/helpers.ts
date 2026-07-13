import { Page } from "@playwright/test";

export function getBaseUrl(): string {
  return process.env.E2E_BASE_URL || "http://localhost:5173";
}

export function getPatientCreds() {
  return {
    email: process.env.E2E_PATIENT_EMAIL || "john.doe@mcc.dev",
    password: process.env.E2E_PATIENT_PASSWORD || "Development123!",
  };
}

export function getDoctorCreds() {
  return {
    email: process.env.E2E_DOCTOR_EMAIL || "dr.ali@mcc.dev",
    password: process.env.E2E_DOCTOR_PASSWORD || "Development123!",
  };
}

export function getCoordinatorCreds() {
  return {
    email: process.env.E2E_COORDINATOR_EMAIL || "coordinator@mcc.dev",
    password: process.env.E2E_COORDINATOR_PASSWORD || "Development123!",
  };
}

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto(getBaseUrl() + "/login", { waitUntil: "load" });
  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}
