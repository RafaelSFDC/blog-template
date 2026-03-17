# Security and Secrets Checklist (SQLite-Only)

## Required Secrets by Environment

## Local Development / Test

- Required:
  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
- Required for protected public auth/comment flows:
  - `TURNSTILE_SECRET_KEY`
- Required for newsletter webhook verification:
  - `RESEND_WEBHOOK_SECRET`

## Local Controlled Production (No Worker/D1)

- Required:
  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `TURNSTILE_SECRET_KEY`
  - `RESEND_WEBHOOK_SECRET`
  - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (if billing enabled)

## Security Controls Revalidated

- Webhook authenticity:
  - Svix signature verification enabled.
  - Timestamp tolerance enabled.
  - Replay guard persisted and enforced.
- Comment/auth antiabuse:
  - Rate-limit in auth/comment protected routes.
  - Turnstile verification for protected routes.
  - Duplicate/suspicious comment classification.
- Audit trail:
  - Security events persisted in DB.
  - Operational events emitted for critical flows.

## Secret Rotation Matrix

- `RESEND_WEBHOOK_SECRET`: rotate immediately after suspected leak or replay anomaly.
- `BETTER_AUTH_SECRET`: rotate on auth compromise suspicion and force session invalidation plan.
- `TURNSTILE_SECRET_KEY`: rotate on bot-abuse spike or provider compromise notice.
- `STRIPE_WEBHOOK_SECRET`: rotate on webhook signature anomaly.

## Incident Response Defaults

- Immediate action: block affected endpoint or enforce stricter validation.
- Containment: rotate compromised secret and invalidate stale requests.
- Recovery: rerun smoke + webhook/comment/auth regression checks.
