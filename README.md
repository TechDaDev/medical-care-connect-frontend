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
| `/register` | Public | Patient registration |
| `/app/patient` | Patient | Dashboard |
| `/app/patient/consultations` | Patient | Consultation list |
| `/app/patient/consultations/new` | Patient | New consultation |
| `/app/patient/consultations/:id` | Patient/Doctor | Consultation detail |
| `/app/patient/consultations/:id/intake` | Patient | AI medical intake |
| `/app/patient/messages/:id` | Patient/Doctor | Messaging |
| `/app/doctor` | Doctor | Dashboard |
| `/app/doctor/consultations` | Doctor | Consultation list |
| `/app/doctor/consultations/:id` | Doctor | Consultation + internal notes |
| `/app/notifications` | All auth | Notifications |
| `/app/profile` | All auth | Profile |
| `/app/staff` | Staff | Placeholder dashboard |

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

## Known Limitations

- No WebSockets — messaging uses polling
- No file uploads
- No payments
- No appointments/scheduling
- No video consultations
- No full staff dashboard
- No E2E tests
