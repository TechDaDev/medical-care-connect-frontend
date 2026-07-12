# E2E Testing

## Setup

```bash
npx playwright install chromium
```

## Environment

Create `e2e/.env` (not committed):

```
E2E_BASE_URL=http://localhost:5173
E2E_PATIENT_EMAIL=patient@test.com
E2E_PATIENT_PASSWORD=testpass123
E2E_DOCTOR_EMAIL=doctor@test.com
E2E_DOCTOR_PASSWORD=testpass123
E2E_COORDINATOR_EMAIL=coordinator@test.com
E2E_COORDINATOR_PASSWORD=testpass123
```

## Run

```bash
npm run test:e2e
```

## Structure

```
e2e/
  auth.spec.ts        — login, logout, role-based access
  consultation.spec.ts — create and view consultations
  .env                — credentials (gitignored)
```

## Artifacts

- `playwright-report/` — HTML report
- `test-results/` — failure traces
- `screenshots/` — visual captures
- `videos/` — recording of failed tests
- `traces/` — Playwright trace viewer data

All gitignored.

## CI

Requires:
- Frontend dev server running
- Backend API running
- Test users seeded
