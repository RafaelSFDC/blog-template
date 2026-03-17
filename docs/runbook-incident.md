# Lumina Incident Runbook (MVP)

## Severity Levels

- `SEV-1`: public outage, auth outage, write path broken.
- `SEV-2`: major feature degraded (editorial/media/comments), no full outage.
- `SEV-3`: partial degradation with workaround.

## Triage Checklist

1. Confirm symptom and blast radius (`/api/health`, `/api/health/readiness`, `/api/health/dependencies`).
2. Check latest structured logs for affected flow (`comments`, `media`, `post/page`, `stripe-webhook`).
3. Identify failing dependency (database, storage, queue, security config).
4. Open incident channel with timestamp, current status, and owner.

## Immediate Mitigation

1. If write flows fail: switch public to read-only fallback where possible.
2. If webhook abuse suspected: rotate webhook secret and reject stale signatures.
3. If storage path fails: keep metadata records and block new uploads temporarily.
4. If DB degraded: validate file lock/corruption, then initiate restore path.

## Rollback Procedure

1. Select last known-good release artifact.
2. Re-deploy previous artifact.
3. Run smoke checks:
  - `/`
  - `/blog`
  - `/api/health/readiness`
  - editorial create/update draft flow
4. Keep incident open until monitoring remains stable for 30 minutes.

## Exit Criteria

- Health endpoints green.
- Critical user journey validated.
- Root cause and corrective actions documented in postmortem.
