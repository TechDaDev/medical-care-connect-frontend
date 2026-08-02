import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: "e2e/.env", quiet: true });
dotenv.config({ path: ".env.e2e", quiet: true });

const runId = process.env.E2E_RUN_ID || `phase-f-${Date.now()}`;
process.env.E2E_RUN_ID = runId;

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
const apiURL = process.env.PLAYWRIGHT_API_URL || "http://127.0.0.1:8000";
const reuseExistingServer =
  process.env.E2E_REUSE_EXISTING_SERVER === "true" || !process.env.CI;
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function assertSafeTarget(label: string, value: string): void {
  if (!value.trim()) {
    throw new Error(`${label} refuses an empty destructive E2E target.`);
  }
  const url = new URL(value);
  if (!localHosts.has(url.hostname)) {
    throw new Error(
      `${label} refuses destructive E2E target "${url.hostname}". ` +
      "Only localhost, 127.0.0.1, or ::1 is permitted.",
    );
  }
}

assertSafeTarget("PLAYWRIGHT_BASE_URL", baseURL);
assertSafeTarget("PLAYWRIGHT_API_URL", apiURL);
if (process.env.E2E_LOCAL_ALLOWED !== "true") {
  throw new Error("E2E_LOCAL_ALLOWED=true is required for destructive local fixtures.");
}

if (localHosts.has(new URL(baseURL).hostname) && process.env.E2E_USE_EXPLICIT_ACCOUNTS !== "true") {
  const password = process.env.E2E_TEST_PASSWORD;
  process.env.E2E_ADMIN_EMAIL = `e2e+${runId}+admin@example.invalid`;
  process.env.E2E_COORDINATOR_EMAIL = `e2e+${runId}+coordinator@example.invalid`;
  process.env.E2E_DOCTOR_EMAIL = `e2e+${runId}+approved@example.invalid`;
  process.env.E2E_PATIENT_EMAIL = `e2e+${runId}+patient@example.invalid`;
  if (password) {
    process.env.E2E_ADMIN_PASSWORD = password;
    process.env.E2E_COORDINATOR_PASSWORD = password;
    process.env.E2E_DOCTOR_PASSWORD = password;
    process.env.E2E_PATIENT_PASSWORD = password;
  }
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: 1,
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  outputDir: "test-results",
  webServer: [
    {
      command: ".venv/bin/python manage.py runserver 127.0.0.1:8000 --noreload",
      cwd: "../mcc_backend",
      url: `${apiURL}/api/readiness/`,
      reuseExistingServer,
      timeout: 120_000,
      env: {
        ...process.env,
        AUTH_LOGIN_RATE: "10000/hour",
        AUTH_REGISTER_RATE: "10000/hour",
        AUTH_REFRESH_RATE: "10000/hour",
        API_ANON_RATE: "10000/hour",
        API_USER_RATE: "10000/hour",
        CORS_ALLOWED_ORIGINS: baseURL,
      },
    },
    {
      command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
      url: baseURL,
      reuseExistingServer,
      timeout: 120_000,
      env: {
        ...process.env,
        PLAYWRIGHT_API_URL: apiURL,
      },
    },
  ],
  use: {
    baseURL,
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
    {
      name: "chromium-mobile",
      testMatch: /(phase-f-permissions|patient-phase-a|patient-phase-b|patient-phase-c|patient-phase-d|patient-phase-e|doctor-phase-a|doctor-phase-b|doctor-phase-c|doctor-phase-d|doctor-phase-e)\.spec\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
