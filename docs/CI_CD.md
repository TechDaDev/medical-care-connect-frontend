# CI/CD — Frontend

## Overview

The frontend CI runs on GitHub Actions in the frontend repository.

## Workflow: frontend-ci.yml

Triggers on PR or push to `main` affecting frontend files.

**Steps:**

1. **Checkout** — `actions/checkout@v4`
2. **Node setup** — `actions/setup-node@v4`, Node 22, npm cache
3. **Install deps** — `npm ci`
4. **TypeScript check** — `npm run typecheck`
5. **Lint** — `npm run lint`
6. **Unit tests** — `npm run test` (Vitest + React Testing Library)
7. **Build** — `npm run build`
8. **Docker build** — `docker build --no-cache -t mcc-frontend:ci .`

## What CI Verifies

| Check | Fail on |
|-------|---------|
| TypeScript compilation | Any type error |
| ESLint rules | Any lint violation |
| Unit tests pass | Any test failure |
| Production build | Build error |
| Docker build | Dockerfile error |
| Locale key parity | Missing translation keys across locales |

## Related CI

E2E tests run in the **backend repository's** `e2e-ci.yml` workflow, which
starts both backend and frontend, then runs Playwright tests.

See backend `docs/CI_CD.md` for full CI documentation.

## Local CI Simulation

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
