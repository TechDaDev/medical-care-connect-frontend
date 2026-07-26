# Phase E deferred acceptance

Recorded for Phase F. No production data may be changed by these tests.

## Local fixture dependency

Phase E Playwright acceptance needs a local backend seeded with synthetic
administrator, coordinator, doctor, patient, specialty, attachment, scanner,
storage, retention, and audit fixtures. Current Playwright environment targets a
non-local deployment, so the run was stopped before any Phase E scenario.

## Deferred scenarios

- Specialty create, translation edit, deterministic reorder, deactivate,
  public-selection exclusion, and reactivate.
- Attachment quarantine filtering, detail, rescan, unsafe rejection, verified
  clean release, retention block, and retention-eligible byte deletion.
- Administrator success plus coordinator, doctor, patient, and anonymous route
  denial.
- English LTR, Arabic RTL, and Kurdish Sorani RTL rendering.
- Synthetic fixture and browser-artifact cleanup.

Notification delivery retry/cancel acceptance remains architecture-blocked.
Repository currently has in-app notification read state only: no outbound
delivery model, provider worker, retry state, or cancellation state.
