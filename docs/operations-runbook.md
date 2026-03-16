# Operations Runbook

## Core surfaces

- `GET /api/health`
  - liveness only
- `GET /api/health/readiness`
  - validates database, storage, queue, and security config
- `GET /api/health/dependencies`
  - detailed dependency snapshot for diagnosis
- `/dashboard/beta-ops`
  - operational source of truth for beta account stage, onboarding status, feedback, and follow-ups
- `/dashboard/messages`
  - intake queue for contact messages and beta request triage

## Standard checks

1. Check Sentry for new server, queue, or webhook failures.
2. Check worker logs for:
   - `scheduled-editorial-jobs`
   - `newsletter-queue-batch-*`
   - `stripe-webhook-*`
   - `newsletter-webhook-*`
3. Hit `/api/health/readiness`.
4. Run `pnpm ops:smoke -- <base-url>`.
5. Open `/dashboard/beta-ops` and review:
   - blocked onboarding accounts
   - new feedback items
   - untriaged beta requests

## Launch ops rhythm

### Beta request triage

1. Open `/dashboard/messages`.
2. Promote serious beta requests into `/dashboard/beta-ops` before archiving them.
3. Mark the account:
   - `new_lead` when it is only an inbound request
   - `qualified` when ICP and timing are real
   - `onboarding` when hands-on launch help is happening
   - `active_beta` when the account is using the product without launch blockers
   - `at_risk` when launch progress has stalled or confidence is dropping
   - `paused` when the account is intentionally inactive
4. Set onboarding status:
   - `not_started` before scheduling
   - `scheduled` once kickoff is on the calendar
   - `in_progress` while onboarding is active
   - `completed` when the account is launch-capable
   - `blocked` whenever the next step depends on Lumina

### Feedback handling

1. Every actionable beta signal goes into `/dashboard/beta-ops` as a feedback item.
2. Use status:
   - `new` for unreviewed signals
   - `reviewed` once understood
   - `planned` once accepted into follow-up work
   - `closed` once resolved or intentionally not pursued
3. Use priority:
   - `high` for launch blockers or repeat pain
   - `medium` for meaningful friction without hard blocking
   - `low` for polish or longer-term improvements
4. Always add notes when status changes so the next operator understands context.

## Common response paths

### Setup or onboarding blocked

1. Confirm current setup state in `/dashboard/setup`.
2. Confirm blockers in `/dashboard/beta-ops`.
3. If the blocker is product-side, log or update a feedback item before responding.
4. Move onboarding status to `blocked` until the next step is clear.

### Newsletter queue backlog or failures

1. Check `newsletter-queue-batch-*` logs.
2. Review newsletter campaign status in the dashboard.
3. Inspect Resend webhook events.
4. Confirm queue binding exists in readiness output.
5. Retry only after root cause is known.

### Stripe webhook failures

1. Check `stripe-webhook-failed` logs and Sentry.
2. Confirm webhook secret and endpoint URL.
3. Replay the failed event from Stripe only after the endpoint is healthy again.

### Storage or media issue

1. Check readiness storage result.
2. Validate the R2 bucket binding in the current environment.
3. Verify recent media URLs through `/api/media/*`.

## Incident logging

Create or update a feedback item when:

- the same issue affects more than one beta account
- the issue blocks onboarding or publish
- a workaround is manual or risky
- the team needs to revisit the incident after release

Escalate immediately when:

- auth is failing
- readiness returns `failed`
- publishing stops
- checkout or webhooks stop processing
- newsletter delivery is blocked for active campaigns
