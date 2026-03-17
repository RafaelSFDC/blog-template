# Post Go-Live Tracking (24h / 72h)

## Launch Baseline (T0)

- Baseline date: 2026-03-17
- Inputs:
  - `docs/performance-report-prod-readiness.md`
  - `docs/incident-drill-report.md`
  - `docs/go-no-go-record.md`

## 24h Checklist

Scheduled window: 2026-03-18.

- [ ] Error rate reviewed across auth/editorial/media/comments/webhooks.
- [ ] Latency drift reviewed against baseline for `/`, `/blog`, `/blog/$slug`, `/rss/xml`, `/sitemap/xml`.
- [ ] Moderation queue throughput and backlog reviewed.
- [ ] Security event spikes reviewed (`rate-limit`, `turnstile`, `webhook invalid/replay`).
- [ ] Any incident opened with severity and owner.

## 72h Checklist

Scheduled window: 2026-03-20.

- [ ] Stability trend reviewed (24h vs 72h).
- [ ] Repeated failure patterns identified and grouped.
- [ ] Operational runbook gaps updated from real production signals.
- [ ] Hardening backlog prioritized by severity and impact.
- [ ] Final post-launch status shared with owners.

## Initial Hardening Backlog (Seed)

1. Evaluate optional redirect compatibility for feed/sitemap discovery variants.
2. Reduce non-blocking build warnings from third-party module directives.
3. Add automated snapshot validation gate for every release candidate tag.
