# Setup Local

## App runtime

- Use `pnpm dev` for the default local workflow.
- Local development does not require a remote Cloudflare runtime for uploads.
- If the `STORAGE` binding is unavailable, media is written to `public/uploads`.

## When to use Cloudflare runtime locally

- Use `pnpm dev:cf` when you want to validate Worker bindings such as D1 or R2.
- This is the recommended way to test the real binding behavior before deploy.
- Use `pnpm dev:cf:scheduled` when you want to test native Cloudflare scheduled publishing locally.
- When `--test-scheduled` is enabled, trigger the cron path at `http://localhost:3000/__scheduled`.

## Optional R2 API credentials

These are not required for the default local workflow:

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`

If they are present, the app can use R2 through the S3-compatible API as an advanced fallback.
