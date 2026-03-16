# D1 Restore Drill

## Goal

Verify that production data can be exported, restored into staging and validated before any real incident.

## 1. Capture backup

Export production D1 to SQL:

```bash
pnpm ops:backup:d1 --database blog-db --output backups/prod-latest.sql
```

## 2. Restore into staging

Apply the exported SQL into staging:

```bash
pnpm ops:restore:d1 --database blog-db --env staging --file backups/prod-latest.sql
```

## 3. Validate staging after restore

Run smoke checks:

```bash
pnpm ops:smoke -- https://staging.example.com
```

Confirm manually:
- homepage renders
- login works
- dashboard opens
- latest published posts exist
- premium content still gates correctly
- readiness endpoint is healthy

## 4. Production time-travel restore

If production must be restored to a point in time:

```bash
pnpm ops:restore:time-travel --database blog-db --timestamp 2026-03-16T00:00:00.000Z
```

Use time-travel only after:
- backup capture
- incident scope confirmation
- stakeholder approval

## Success criteria

- restore command completes
- staging app boots
- smoke checks pass
- editorial, billing and newsletter flows are readable again
