import { Page } from "@playwright/test";

export function getBaseUrl(): string {
  return process.env.E2E_BASE_URL || "http://localhost:5173";
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export function getPatientCreds() {
  return {
    email: requireEnv("E2E_PATIENT_EMAIL"),
    password: requireEnv("E2E_PATIENT_PASSWORD"),
  };
}

export function getDoctorCreds() {
  return {
    email: requireEnv("E2E_DOCTOR_EMAIL"),
    password: requireEnv("E2E_DOCTOR_PASSWORD"),
  };
}

export function getCoordinatorCreds() {
  return {
    email: requireEnv("E2E_COORDINATOR_EMAIL"),
    password: requireEnv("E2E_COORDINATOR_PASSWORD"),
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
}
