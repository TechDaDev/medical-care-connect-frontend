import { execFileSync } from "node:child_process";
import path from "node:path";

export default function globalSetup(): void {
  const runId = process.env.E2E_RUN_ID;
  const password = process.env.E2E_TEST_PASSWORD || process.env.E2E_ADMIN_PASSWORD;
  if (!runId) throw new Error("E2E_RUN_ID missing.");
  if (!password) throw new Error("E2E_TEST_PASSWORD or E2E_ADMIN_PASSWORD missing.");

  const backend = path.resolve(process.cwd(), "../mcc_backend");
  try {
    execFileSync(
      path.join(backend, ".venv/bin/python"),
      ["manage.py", "seed_e2e_data", "--run-id", runId],
      {
        cwd: backend,
        env: { ...process.env, E2E_TEST_PASSWORD: password },
        stdio: "pipe",
      },
    );
  } catch {
    throw new Error("Synthetic E2E seed failed. Check local backend/database readiness.");
  }
}
