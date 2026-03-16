# Analytics Taxonomy v1

PostHog is the source of truth for Lumina product, marketing, onboarding, newsletter, and revenue analytics in this phase.

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
| `lumina_beta_request_submitted` | Beta request submitted for Lumina | Server | `surface`, `role`, `publication_type`, `current_stack` | Successful beta request persistence | Acquisition |
| `project_setup_started` | Admin started guided setup | Server | `surface`, `actor_user_id`, `user_role` | First setup entry | Activation, onboarding |
| `project_setup_step_completed` | Setup wizard step completed | Server | `surface`, `actor_user_id`, `step`, `site_preset_key` | Save of any wizard step | Onboarding |
| `project_setup_skipped` | Setup wizard skipped | Server | `surface`, `actor_user_id`, `user_role` | Skip action | Onboarding |
| `project_setup_completed` | Setup completed end-to-end | Server | `surface`, `actor_user_id`, `site_preset_key`, `starter_content_generated` | Final setup submission | Activation, onboarding |
| `starter_content_generated` | Starter drafts generated | Server | `surface`, `site_preset_key`, `created_pages`, `created_welcome_post` | Starter kit generation | Onboarding |
| `pricing_configured` | Stripe price IDs saved | Server | `surface`, `has_monthly_price`, `has_annual_price` | Monetization step saved | Activation |
| `newsletter_configured` | Newsletter sender config saved | Server | `surface`, `has_sender_email`, `double_opt_in_enabled` | Newsletter step saved | Activation |
| `first_post_published` | First publication post went live | Server | `surface`, `post_id`, `post_slug`, `post_title`, `actor_user_id` | First transition to published | Activation |
| `first_subscriber_captured` | First subscriber captured | Server | `surface`, `subscriber_id`, `source` | First subscriber insert | Retention |
| `checkout_started` | Membership checkout flow started | Client + server | `surface`, `plan_slug`, `source`, `post_slug` | Pricing CTA, paywall CTA, or Stripe checkout creation | Monetization |
| `checkout_completed` | Membership checkout completed | Server | `surface`, `plan_slug`, `stripe_subscription_id`, `stripe_customer_id` | Stripe webhook checkout completion | Monetization |
| `billing_portal_opened` | Billing portal opened | Server | `surface`, `user_id`, `stripe_customer_id` | Billing portal session creation | Monetization, retention |
| `subscription_canceled` | Subscription canceled | Server | `surface`, `stripe_customer_id`, `stripe_subscription_id` | Stripe subscription deletion webhook | Monetization |
| `paywall_cta_clicked` | Paywall CTA clicked on a post | Client | `surface`, `plan_slug`, `post_slug`, `post_title` | Paywall subscribe interaction | Monetization |
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
