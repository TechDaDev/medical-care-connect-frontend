import { Page } from "@playwright/test";

export function getBaseUrl(): string {
  return process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export function getPatientCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: process.env.E2E_PATIENT_EMAIL || `e2e+${runId}+patient@example.invalid`,
    password: process.env.E2E_PATIENT_PASSWORD || requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getDoctorCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: process.env.E2E_DOCTOR_EMAIL || `e2e+${runId}+approved@example.invalid`,
    password: process.env.E2E_DOCTOR_PASSWORD || requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getPendingDoctorCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: `e2e+${runId}+pending@example.invalid`,
    password: requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getRejectedDoctorCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: `e2e+${runId}+rejected@example.invalid`,
    password: requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getSuspendedDoctorCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: `e2e+${runId}+suspended@example.invalid`,
    password: requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getMissingProfileDoctorCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: `e2e+${runId}+missing-profile@example.invalid`,
    password: requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getSecondPatientCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: `e2e+${runId}+patient-reject@example.invalid`,
    password: requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getCoordinatorCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: process.env.E2E_COORDINATOR_EMAIL || `e2e+${runId}+coordinator@example.invalid`,
    password: process.env.E2E_COORDINATOR_PASSWORD || requireEnv("E2E_TEST_PASSWORD"),
  };
}

export function getAdminCreds() {
  const runId = requireEnv("E2E_RUN_ID");
  return {
    email: process.env.E2E_ADMIN_EMAIL || `e2e+${runId}+admin@example.invalid`,
    password: process.env.E2E_ADMIN_PASSWORD || requireEnv("E2E_TEST_PASSWORD"),
  };
}

export async function setLocale(page: Page, locale: string = "en"): Promise<void> {
  await page.goto(getBaseUrl(), { waitUntil: "domcontentloaded" });
  await page.evaluate((l) => {
    localStorage.setItem("mcc_lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" || l === "ckb" ? "rtl" : "ltr";
  }, locale);
}

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Set locale to English for consistent test text matching
  await setLocale(page, "en");
  await page.goto(getBaseUrl() + "/login", { waitUntil: "networkidle" });
  // Wait for React hydration - login form should render
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app(?:\/|$)/, { timeout: 15_000 });
}
