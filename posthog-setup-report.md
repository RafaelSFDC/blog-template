<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into your Lumina blog project. Here is a summary of all changes made:

## Summary of changes

- **Installed** `@posthog/react` (v1.8.2) and `posthog-node` (v5.28.0)
- **Updated** `src/components/analytics/posthog-provider.tsx` to use `@posthog/react`'s `PostHogProvider`, with `capture_exceptions`, `person_profiles: "identified_only"`, and the `/ingest` proxy path
- **Updated** `src/hooks/use-tracking.ts` to use the correct env var name `VITE_PUBLIC_POSTHOG_KEY`
- **Created** `src/server/posthog.ts` — a singleton PostHog Node.js server client for server-side event captures
- **Updated** `vite.config.ts` to proxy `/ingest` to `https://us.i.posthog.com` (avoids ad-blockers in dev)
- **Added** `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` to `.env`
- **Added** `identify()` calls on login and registration so users are tied to their email
- **Added** `posthog.reset()` on sign-out to clear the identity
- **Added** session/distinct ID headers on the Stripe checkout fetch so client and server events are correlated in PostHog sessions

## Instrumented events

| Event | Description | File |
|-------|-------------|------|
| `user_signed_in` | User successfully logs in via email | `src/routes/_public/auth/login.tsx` |
| `user_signed_up` | New user registers an account | `src/routes/_public/auth/register.tsx` |
| `user_signed_out` | User signs out (+ `posthog.reset()`) | `src/routes/_public/account.tsx` |
| `profile_updated` | User saves changes to their profile | `src/routes/_public/account.tsx` |
| `password_changed` | User changes their password | `src/routes/_public/account.tsx` |
| `newsletter_subscribed` | Reader subscribes to the newsletter | `src/components/blog/newsletter.tsx` |
| `post_comment_submitted` | Reader submits a comment on a post | `src/routes/_public/blog/$slug.tsx` |
| `post_shared` | Reader shares a post on social or copies link | `src/components/social-sharing.tsx` |
| `subscription_checkout_started` | Reader clicks upgrade/subscribe (client-side) | `src/routes/_public/blog/$slug.tsx` |
| `subscription_checkout_created` | Stripe checkout session created (server-side) | `src/routes/api/stripe/checkout.ts` |
| `subscription_activated` | Stripe webhook confirms subscription is live | `src/routes/api/stripe/webhook.ts` |
| `post_created` | Author publishes a new post from the dashboard | `src/routes/dashboard/posts/new.tsx` |
| `newsletter_campaign_sent` | Author sends a newsletter campaign | `src/routes/dashboard/newsletters/new.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/337516/dashboard/1346978
  - **Subscription Conversion Funnel**: https://us.posthog.com/project/337516/insights/5xFn86Ud
  - **Daily Sign-Ups & Sign-Ins**: https://us.posthog.com/project/337516/insights/wf0N9PHk
  - **Weekly Revenue Events**: https://us.posthog.com/project/337516/insights/4XTeu1tp
  - **Content Engagement**: https://us.posthog.com/project/337516/insights/PbnTfSK8
  - **Daily Sign-Outs (Churn Signal)**: https://us.posthog.com/project/337516/insights/G9IX2foA

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
