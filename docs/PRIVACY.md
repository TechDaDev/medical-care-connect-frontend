# Privacy Pages (Frontend)

## Overview

Privacy pages allow users to manage their data — export personal data,
deactivate their account, and request account deletion.

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/app/privacy` | All auth | Privacy settings hub |
| `/app/privacy/exports` | All auth | Data export management |
| `/app/privacy/exports/new` | All auth | Request new data export |
| `/app/privacy/exports/:id` | All auth | Export detail + download |
| `/app/privacy/deactivation` | All auth | Account deactivation |
| `/app/privacy/deletion` | All auth | Account deletion request |

## Features

### Data Export

- Users can request a ZIP export of their personal data
- Export includes: profile info, patient data, consultation metadata,
  message history, notification history, attachment metadata
- Export does NOT include: medical records, doctor notes, file contents
- Exports expire after 7 days — download before they expire
- Users can delete completed/expired exports
- Status indicators: pending, processing, completed, failed, expired, deleted

### Account Deactivation

- User can deactivate their own account (requires password confirmation)
- Deactivated accounts cannot log in
- Data is preserved — admin can reactivate
- Users should understand deactivation is not deletion

### Account Deletion Request

- User submits deletion request with optional reason
- Admin must review and approve/reject
- User can cancel a pending request
- Approved deletions are scheduled, not immediate
- Medical records and consultations are retained per legal requirements

## Translations Needed

All privacy pages require keys in all three locale files (`ar.json`,
`en.json`, `ckb.json`):

### Key Prefixes

| Prefix | Description |
|--------|-------------|
| `privacy.title` | Page title |
| `privacy.export.*` | Export-related strings |
| `privacy.deactivation.*` | Deactivation strings |
| `privacy.deletion.*` | Deletion request strings |
| `privacy.status.*` | Status labels (pending, completed, etc.) |
| `privacy.error.*` | Error messages |
| `privacy.confirm.*` | Confirmation dialogs |

### Key Export Keys

| Key | Example |
|-----|---------|
| `privacy.export.title` | "Data Export" |
| `privacy.export.request` | "Request Export" |
| `privacy.export.download` | "Download" |
| `privacy.export.expires` | "Expires in {days} days" |
| `privacy.export.status_pending` | "Processing..." |
| `privacy.export.status_completed` | "Ready to Download" |
| `privacy.export.status_expired` | "Expired" |
| `privacy.export.no_exports` | "No export requests" |
| `privacy.export.size` | "File size: {size}" |

### Key Deactivation Keys

| Key | Example |
|-----|---------|
| `privacy.deactivation.title` | "Deactivate Account" |
| `privacy.deactivation.warning` | "This will disable your account" |
| `privacy.deactivation.password_label` | "Confirm password" |
| `privacy.deactivation.confirm` | "Are you sure?" |
| `privacy.deactivation.success` | "Account deactivated" |

### Key Deletion Keys

| Key | Example |
|-----|---------|
| `privacy.deletion.title` | "Delete Account" |
| `privacy.deletion.reason_label` | "Reason for deletion" |
| `privacy.deletion.reason_placeholder` | "Optional: tell us why" |
| `privacy.deletion.status_pending` | "Under review" |
| `privacy.deletion.status_approved` | "Approved — deletion scheduled" |
| `privacy.deletion.status_rejected` | "Request rejected" |
| `privacy.deletion.cancel` | "Cancel Request" |

## API Integration

The privacy pages communicate with these backend endpoints:

| Backend Endpoint | Frontend Usage |
|-----------------|----------------|
| `POST /api/privacy/exports/` | Request new export |
| `GET /api/privacy/exports/` | List exports |
| `GET /api/privacy/exports/{id}/` | Export detail |
| `GET /api/privacy/exports/{id}/download/` | Download export |
| `DELETE /api/privacy/exports/{id}/` | Delete export |
| `POST /api/privacy/account/deactivate/` | Deactivate account |
| `POST /api/privacy/account/reactivate/` | Admin reactivation |
| `POST /api/privacy/deletion-requests/` | Request deletion |
| `GET /api/privacy/deletion-requests/` | List deletion requests |
| `GET /api/privacy/deletion-requests/{id}/` | Deletion request detail |
| `POST /api/privacy/deletion-requests/{id}/cancel/` | Cancel deletion request |
