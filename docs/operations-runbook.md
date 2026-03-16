# Operations Runbook

## Health endpoints

- `GET /api/health`
  - liveness only
- `GET /api/health/readiness`
  - validates database, storage, queue and security config
- `GET /api/health/dependencies`
  - detailed dependency snapshot for diagnosis

## Standard checks

1. Check `Sentry` for current worker errors
2. Check Worker logs for:
   - `scheduled-editorial-jobs`
   - `newsletter-queue-batch-*`
   - `stripe-webhook-*`
   - `newsletter-webhook-*`
3. Hit readiness endpoint
4. Run smoke script:
   - `pnpm ops:smoke -- https://your-environment.example.com`

## Incident paths

### Cron not publishing scheduled posts

1. Check Worker cron execution in logs
2. Confirm `/api/health/readiness`
3. Validate DB availability
4. Confirm scheduled posts still exist with `status = scheduled`
5. If needed, manually trigger `GET /api/cron/publish?secret=...`

### Newsletter queue backlog or failures

1. Check `newsletter-queue-batch-*` logs
2. Review newsletter campaign status in dashboard
3. Inspect Resend webhook events
4. Confirm queue binding exists in readiness output
5. Retry only after root cause is known

### Stripe webhook failures

1. Check `stripe-webhook-failed` logs and Sentry
2. Confirm webhook secret and endpoint URL
3. Replay the failed event from Stripe only after the endpoint is healthy again

### Storage/media issue

1. Check readiness storage result
2. Validate R2 bucket binding in the current environment
3. Verify recent media URLs through `/api/media/*`
