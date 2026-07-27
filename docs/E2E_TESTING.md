# Local E2E Testing

Install Chromium once:

```bash
npx playwright install --with-deps chromium
```

Copy `.env.e2e.example` to `.env.e2e`, set `E2E_TEST_PASSWORD`, keep local file untracked, then run:

```bash
npm run test:e2e
```

Default topology:

- Frontend: `http://127.0.0.1:4173`
- Backend: `http://127.0.0.1:8000`
- Database: local Docker PostgreSQL
- Projects: desktop Chromium and mobile Chromium

Playwright refuses non-local targets unless isolated hostname is explicitly listed in `E2E_APPROVED_HOSTS`. Local tests ignore explicit account variables by default and use unique run-scoped synthetic accounts. Set `E2E_USE_EXPLICIT_ACCOUNTS=true` only for an approved isolated environment.

Global setup calls backend `seed_e2e_data`; teardown calls `cleanup_e2e_data` and fails if artifacts remain. Backend refuses seeding unless DEBUG, local database host, and local attachment storage are active.

Trace appears on first retry. Screenshots/video remain only for failures. All result directories are ignored and must be removed before final Git review.

Current Phase F permission spec checks anonymous, patient, doctor, coordinator, and administrator against staff/admin APIs and frontend routes. Existing feature specs remain part of full suite; hard-coded or stale fixture assumptions must be treated as failures, never silently skipped.
