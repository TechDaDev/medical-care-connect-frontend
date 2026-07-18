import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";

// Load E2E credentials from e2e/.env
dotenv.config({ path: "e2e/.env" });

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
  ],
});
