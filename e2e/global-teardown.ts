import { execFileSync } from "node:child_process";
import path from "node:path";

export default function globalTeardown(): void {
  const runId = process.env.E2E_RUN_ID;
  if (!runId) return;
  const backend = path.resolve(process.cwd(), "../mcc_backend");
  try {
    execFileSync(
      path.join(backend, ".venv/bin/python"),
      ["manage.py", "cleanup_e2e_data", "--run-id", runId],
      { cwd: backend, env: process.env, stdio: "pipe" },
    );
  } catch {
    throw new Error("Synthetic E2E cleanup verification failed.");
  }
}
