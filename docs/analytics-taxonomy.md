# Analytics Taxonomy v1

PostHog is the source of truth for Lumina product, marketing, onboarding, newsletter, and revenue analytics in this phase.

`/lumina/*` is the canonical commercial surface for the Lumina product.
`/_public/*` remains the canonical reader-facing surface for the publication built with Lumina.

The commercial contract for this launch phase is beta-first:

- primary conversion goal: beta request
- supporting CTA paths: pricing and how it works
- no self-serve checkout for the Lumina product in this phase

## Common properties

- `surface`: where the event happened (`dashboard`, `dashboard_setup`, `public_site`, `lumina_marketing`, `checkout`, `newsletter`, `auth`, `billing`)
- `path`: route or destination path when relevant
- `plan_slug`: plan involved in pricing or checkout
- `site_preset_key`: selected preset during setup
- `step`: setup step key
- `newsletter_id`: newsletter campaign identifier
- `delivery_id`: newsletter delivery identifier
- `campaign_segment`: newsletter audience segment
- `user_role`: current user role when available
- `source`: contextual source for CTA or flow attribution

## Canonical events

| Event | Description | Origin | Key properties | Trigger moment | Used in |
| --- | --- | --- | --- | --- | --- |
| `lumina_marketing_page_view` | View of a product marketing page under `/lumina` | Client | `surface`, `path`, `source` | Route change on Lumina marketing surface | Acquisition |
| `lumina_cta_clicked` | Click on a marketing CTA | Client | `surface`, `path`, `cta_label`, `cta_href`, `source` | Click on Lumina marketing CTA | Acquisition |
| `lumina_beta_request_submitted` | Beta request submitted for Lumina | Server | `surface`, `role`, `publication_type`, `current_stack`, `path`, `source` | Successful beta request persistence | Acquisition |
| `project_setup_started` | Admin started guided setup | Server | `surface`, `actor_user_id`, `user_role` | First setup entry | Activation, onboarding |
| `project_setup_step_completed` | Setup wizard step completed | Server | `surface`, `actor_user_id`, `step`, `site_preset_key` | Save of any wizard step | Onboarding |
| `project_setup_skipped` | Setup wizard skipped | Server | `surface`, `actor_user_id`, `user_role` | Skip action | Onboarding |
| `project_setup_completed` | Setup completed end-to-end | Server | `surface`, `actor_user_id`, `site_preset_key`, `starter_content_generated` | Final setup submission | Activation, onboarding |
| `starter_content_generated` | Starter drafts generated | Server | `surface`, `site_preset_key`, `created_pages`, `created_welcome_post` | Starter kit generation | Onboarding |
| `pricing_configured` | Stripe price IDs saved | Server | `surface`, `has_monthly_price`, `has_annual_price` | Monetization step saved | Activation |
| `newsletter_configured` | Newsletter sender config saved | Server | `surface`, `has_sender_email`, `double_opt_in_enabled` | Newsletter step saved | Activation |
| `first_post_published` | First publication post went live | Server | `surface`, `post_id`, `post_slug`, `post_title`, `actor_user_id` | First transition to published | Activation |
| `first_subscriber_captured` | First subscriber captured | Server | `surface`, `subscriber_id`, `source` | First subscriber insert | Retention |
| `checkout_started` | Membership checkout flow started | Client + server | `surface`, `plan_slug`, `source`, `path`, `post_slug` | Pricing CTA, paywall CTA, or Stripe checkout creation | Monetization |
| `checkout_completed` | Membership checkout completed | Server | `surface`, `plan_slug`, `stripe_subscription_id`, `stripe_customer_id` | Stripe webhook checkout completion | Monetization |
| `billing_portal_opened` | Billing portal opened | Server | `surface`, `user_id`, `stripe_customer_id`, `account_retention_state`, `source` | Billing portal session creation | Monetization, retention |
| `subscription_canceled` | Subscription canceled | Server | `surface`, `stripe_customer_id`, `stripe_subscription_id` | Stripe subscription deletion webhook | Monetization |
| `paywall_cta_clicked` | Paywall CTA clicked on a post | Client | `surface`, `plan_slug`, `post_slug`, `post_title` | Paywall subscribe interaction | Monetization |
| `pricing_plan_selected` | A pricing plan was selected before checkout | Client | `surface`, `path`, `plan_slug`, `source`, `paywall_variant`, `post_slug` | Plan card or selector interaction on `/pricing` | Monetization |
| `pricing_cta_clicked` | A pricing CTA was clicked before checkout starts | Client | `surface`, `path`, `plan_slug`, `source`, `paywall_variant`, `post_slug` | Primary pricing CTA click | Monetization |
| `account_upgrade_prompt_clicked` | An account retention prompt was clicked | Client | `surface`, `path`, `plan_slug`, `source`, `account_retention_state` | Primary membership action on `/account` | Monetization, retention |
| `newsletter_campaign_sent` | Newsletter campaign entered send flow | Server | `surface`, `newsletter_id`, `campaign_segment` | Queue/send start | Retention, newsletter |
| `newsletter_subscribed` | Newsletter signup submitted | Client + server | `surface`, `subscriber_id`, `email`, `source` | Successful subscribe flow | Newsletter |
| `newsletter_confirmed` | Double opt-in confirmed | Server | `surface`, `subscriber_id` | Confirm token success | Newsletter |
| `newsletter_unsubscribed` | Newsletter unsubscribed | Server | `surface`, `subscriber_id` | Unsubscribe token success | Newsletter |
| `newsletter_opened` | Newsletter opened | Server | `surface`, `newsletter_id`, `delivery_id` | Open pixel or provider open event | Newsletter |
| `newsletter_clicked` | Newsletter link clicked | Server | `surface`, `newsletter_id`, `delivery_id`, `path` | Click tracking redirect | Newsletter |
| `dashboard_session_started` | Dashboard session started | Client | `surface`, `path`, `user_role` | Dashboard layout mount | Retention |
| `user_signed_in` | User signed in | Client | `surface`, `method` | Successful auth flow | Activation support |
| `user_signed_up` | User signed up | Client | `surface`, `method` | Successful registration flow | Activation support |

## Legacy dual-write

The following legacy names still receive temporary dual-write where applicable:

- `checkout_started` -> `subscription_checkout_started`, `pricing_checkout_started`
- `checkout_completed` -> `subscription_activated`
- `newsletter_campaign_sent` -> `newsletter_campaign_queued`

New dashboard queries and new analysis should read only canonical events.

## Official launch reads

The minimum official launch reads in `/dashboard/analytics` are:

- activation / onboarding: setup start, setup completion, pricing configured, newsletter configured, first post published, setup-step breakdown
- acquisition / marketing: Lumina page views, CTA clicks, beta requests, CTA source breakdown, beta-request source breakdown
- monetization: pricing plan selections, pricing CTA clicks, paywall CTA clicks, checkout starts, checkout completions, billing portal opens, subscription cancellations, checkout source breakdown
- newsletter / publication: newsletter campaigns sent, newsletter subscribers, first subscriber captured, first post published, newsletter source breakdown
- retention / operations: dashboard sessions, setup skips, billing portal opens, account upgrade prompt clicks
