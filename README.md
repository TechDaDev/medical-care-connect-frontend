# Medical Care Connect — Frontend

AI-assisted medical intake and consultation platform. Patient-to-doctor messaging with DeepSeek-powered medical intake.

## Stack

- React 19 + TypeScript
- Vite 8
- React Router 7
- Tailwind CSS 4
- Axios
- TanStack Query (React Query) 5
- React Hook Form + Zod
- Lucide React
- date-fns
- Vitest + React Testing Library

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api` | Backend API base |
| `VITE_APP_NAME` | `Medical Care Connect` | App display name |
| `VITE_MESSAGE_POLL_INTERVAL_MS` | `10000` | Message polling interval |
| `VITE_NOTIFICATION_POLL_INTERVAL_MS` | `30000` | Notification polling interval |

## Backend Requirement

Backend must be running at `VITE_API_BASE_URL`. Start with:

```bash
cd ../mcc_backend
source .venv/bin/activate
python manage.py runserver
```

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/doctors` | Public | Doctor directory |
| `/doctors/:id` | Public | Doctor detail |
| `/login` | Public | Login |
| `/register` | Public | Patient or doctor registration |
| `/app/patient` | Patient | Dashboard |
| `/app/patient/consultations` | Patient | Consultation list |
| `/app/patient/consultations/new` | Patient | New consultation |
| `/app/patient/consultations/:id` | Patient/Doctor | Consultation detail |
| `/app/patient/consultations/:id/intake` | Patient | AI medical intake |
| `/app/patient/messages/:id` | Patient/Doctor | Messaging |
| `/app/patient/medical-records/:id` | Patient | Medical record view |
| `/app/doctor` | Approved doctor | Dashboard |
| `/app/doctor/pending-approval` | Pending/rejected doctor | Application status |
| `/app/doctor/consultations` | Doctor | Consultation list |
| `/app/doctor/consultations/:id` | Doctor | Consultation + internal notes |
| `/app/doctor/messages/:id` | Doctor | Messaging |
| `/app/staff` | Staff | Dashboard |
| `/app/staff/consultations` | Staff | Consultation list with filters |
| `/app/staff/consultations/:id` | Staff | Consultation detail + transfer/priority |
| `/app/staff/doctors` | Staff | Doctor workload |
| `/app/notifications` | All auth | Notifications |
| `/app/profile` | All auth | Profile |
| `/app/medical-records/:id` | All auth | Flat redirect route |


## Role-Based `/app` Redirect

The `/app` root checks the authenticated user's role:

- `patient` → `/app/patient`
- approved `doctor` → `/app/doctor`; other doctor applications → `/app/doctor/pending-approval`
- `coordinator` or `administrator` → `/app/staff`

Role-restricted routes enforce access via `RequireRole`. Unauthorized access redirects to `/unauthorized`.

## Consultation Creation

`POST /api/consultations/`

```json
{
  "doctor": "uuid",         // required — DoctorProfile ID
  "specialty": "uuid",      // optional — defaults to null
  "priority": "medium",     // optional — low|medium|high|urgent
  "description": "..."      // optional — free text
}
```

The backend sets `patient`, `status=submitted`, and `submitted_at` server-side.
Do not send `patient`, `status`, `doctor_id`, `chief_complaint`, or `patient_note`.
These are not accepted by the backend.

## Authentication

JWT tokens stored in localStorage via `src/auth/tokenStorage.ts`. Access token included in `Authorization: Bearer` header. 401 responses trigger one refresh attempt; failure clears auth state and redirects to `/login`.

**Token storage note:** localStorage used because backend returns tokens in JSON. HTTP-only cookies more secure. Migration recommended.

## AI Intake Safety

- AI collects preliminary information only — no diagnosis
- Final clinical assessment by doctor
- Emergency keyword screening blocks AI calls
- MCC is not an emergency service

## Messaging

HTTP polling-based messaging (no WebSockets). Poll interval configurable via `VITE_MESSAGE_POLL_INTERVAL_MS`. Unread messages auto-marked read on fetch.

## Language / RTL

English (default) and Arabic supported via JSON dictionaries in `src/utils/`. Language switch in top bar updates `dir` and `lang` globally.

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run test         # Run tests
npm run preview      # Preview production build
```

## Phase 8C — Privacy, Operations & Observability

### Routes Added

| Path | Access | Description |
|------|--------|-------------|
| `/app/privacy` | All auth | Privacy settings hub |
| `/app/privacy/exports` | All auth | Data export management |
| `/app/privacy/deactivation` | All auth | Account deactivation |
| `/app/privacy/deletion` | All auth | Account deletion request |
| `/app/staff/operations` | Admin | Operations dashboard |
| `/app/staff/operations/status` | Admin | System status |
| `/app/staff/operations/metrics` | Admin | Aggregated metrics |

### Features Added

- **Data Export** — request, download, and manage personal data exports
- **Account Deactivation** — self-service deactivation with password confirmation
- **Account Deletion Request** — request deletion with admin review workflow
- **Operations Dashboard** — admin-only system status and metrics views
- **Request ID in errors** — `X-Request-ID` header and `request_id` field
  in error responses for debugging
- **E2E tests** — Playwright tests for privacy and operations flows

### Environment Variables Added

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_APP_VERSION` | — | App version for display |
| `VITE_APP_RELEASE` | — | Release name for display |

## Known Limitations

- No WebSockets — messaging uses HTTP polling
- No file uploads
- No payments
- No appointments/scheduling
- No video consultations
- Consultation `description` field maps from what was previously called `chief_complaint` in frontend types
- All normalised errors follow `{detail, code, fields}` format from backend
- JWT localStorage (not httpOnly cookie) — CSRF risk accepted for local dev
