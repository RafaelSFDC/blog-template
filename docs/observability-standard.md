# Observability Standard (SQLite-Only)

## Structured Event Contract

All operational logs must emit this envelope:

- `level`: `info | warn | error`
- `event`: stable event name (`kebab-case`)
- `timestamp`: ISO-8601 UTC
- `actor`: user id/email/system identifier or `null`
- `entity`: domain target (`auth`, `post`, `comment`, `media`, `newsletter.webhook`, etc.)
- `outcome`: `success | warning | failure`

Optional payload fields are allowed (`postId`, `statusCode`, `reason`, `count`, etc.).

## Critical Flows Covered

- Auth route protections:
  - `auth-registration-locked`
  - `auth-rate-limit-rejected`
  - `auth-turnstile-rejected`
  - `auth-request-processed`
- Editorial lifecycle:
  - `post-created`
  - `post-updated`
  - `post-review-requested`
  - `post-workflow-transitioned`
  - `post-revision-restored`
  - `post-webhook-delivery-failed`
- Media:
  - `media-uploaded`
  - `media-upload-failed`
  - `media-deleted`
  - `media-bulk-deleted`
  - `media-orphans-cleaned`
- Comments/moderation:
  - `comment-created`
  - `comment-blocked`
  - `comment-flagged-spam`
  - `comment-moderation-updated`
  - `comment-moderation-deleted`
  - `comment-moderation-bulk-deleted`
  - `comment-moderation-bulk-updated`
- Newsletter webhook:
  - `newsletter-webhook-processed`
  - `newsletter-webhook-failed`

## Health Contract

- `GET /api/health`:
  - Liveness payload with `status=ok`.
- `GET /api/health/readiness`:
  - Readiness aggregate and dependency checks.
- `GET /api/health/dependencies`:
  - Dependency breakdown without aggregate decision.

## Severity Thresholds (MVP)

- `SEV-1`: service unavailable, data loss risk, or auth/security critical break.
- `SEV-2`: degraded core journeys (publish, moderation, subscription).
- `SEV-3`: non-critical degradation with workaround.

Alert triggers:
- `SEV-1`: immediate paging.
- `SEV-2`: page during business hours, immediate channel notification.
- `SEV-3`: ticket + async triage.
