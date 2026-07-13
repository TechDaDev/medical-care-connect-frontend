# Deployment

## Prerequisites

- Docker and Docker Compose
- Node.js 22+ (local dev)

## Docker Build

```bash
docker build -t mcc-frontend:latest .
```

## Nginx

Serves the built SPA from `/usr/share/nginx/html`.

### Features

- SPA fallback — all routes redirect to `index.html`
- `/healthz` — returns 200 OK
- Static asset caching — 1 year, immutable
- No aggressive index.html caching
- Security headers:

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 0 |
| Referrer-Policy | strict-origin-when-cross-origin |
| Content-Security-Policy | (configurable via nginx) |
| Permissions-Policy | (configurable via nginx) |

## Environment

```bash
cp .env.production.example .env
```

Required:
- `VITE_API_BASE_URL` — backend API URL

Optional:
- `VITE_APP_VERSION` — displayed in operations dashboard
- `VITE_APP_RELEASE` — release name in operations dashboard

## Production Compose

See backend `docker-compose.production.yml` — frontend service included.

## Notes

- No JWT stored in localStorage
- No `.env` committed
- CSRF token extracted from `mcc_csrftoken` cookie
