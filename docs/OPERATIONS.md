# Operations Pages (Frontend)

## Overview

Admin-only operations dashboard showing system health, operational status,
and aggregated metrics. Accessed via the staff area.

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/app/staff/operations` | Admin | Operations overview dashboard |
| `/app/staff/operations/status` | Admin | Detailed system status |
| `/app/staff/operations/metrics` | Admin | Aggregated metrics view |

## Features

### Operations Overview

Displays key operational indicators at a glance:

- Backend version, release, and commit SHA
- Environment (production/development)
- Database and attachment storage status
- AI intake enabled/disabled
- Error monitor provider
- Latest migration applied
- Retention candidate count
- Degraded components list

### Metrics View

Aggregated operational metrics:

- Uptime (seconds)
- User counts by role (patient, doctor, coordinator, administrator)
- Consultation counts by status (submitted, accepted, cancelled, completed)
- Attachment counts by scan status
- Total attachment storage bytes
- Pending notification count
- Expired retention candidates

### Status Indicators

Each component shows a green/red status indicator:

| Component | Healthy | Unhealthy |
|-----------|---------|-----------|
| Database | `database_available: true` | `database_available: false` |
| Storage | `attachment_root_writable: true` | `attachment_root_writable: false` |

## API Integration

| Backend Endpoint | Frontend Usage |
|-----------------|----------------|
| `GET /api/health/` | Quick health indicator |
| `GET /api/readiness/` | Readiness status |
| `GET /api/staff/operations/status/` | Detailed status (admin) |
| `GET /api/staff/operations/metrics/` | Aggregated metrics (admin) |

All operations endpoints use `CookieJWTAuthentication`. The status and
metrics endpoints also require `IsAdministrator` permission.

## Translations Needed

| Key | Example |
|-----|---------|
| `operations.title` | "Operations" |
| `operations.status.title` | "System Status" |
| `operations.metrics.title` | "Metrics" |
| `operations.version` | "Version: {version}" |
| `operations.commit` | "Commit: {sha}" |
| `operations.environment` | "Environment: {env}" |
| `operations.database` | "Database" |
| `operations.storage` | "Attachment Storage" |
| `operations.ai_status` | "AI Intake" |
| `operations.degraded` | "Degraded: {components}" |
| `operations.metrics.uptime` | "Uptime: {seconds}s" |
| `operations.metrics.users` | "Users: {total}" |
| `operations.metrics.consultations` | "Consultations" |
| `operations.metrics.attachments` | "Attachments" |
