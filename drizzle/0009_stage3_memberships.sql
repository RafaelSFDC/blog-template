ALTER TABLE posts ADD COLUMN teaser_mode text DEFAULT 'excerpt' NOT NULL;
ALTER TABLE pages ADD COLUMN is_premium integer DEFAULT 0 NOT NULL;
ALTER TABLE pages ADD COLUMN teaser_mode text DEFAULT 'excerpt' NOT NULL;
ALTER TABLE post_revisions ADD COLUMN teaser_mode text DEFAULT 'excerpt' NOT NULL;
ALTER TABLE page_revisions ADD COLUMN is_premium integer DEFAULT 0 NOT NULL;
ALTER TABLE page_revisions ADD COLUMN teaser_mode text DEFAULT 'excerpt' NOT NULL;

CREATE TABLE membership_plans (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  interval text NOT NULL,
  stripe_price_id text UNIQUE,
  price_cents integer,
  currency text DEFAULT 'usd' NOT NULL,
  is_active integer DEFAULT 1 NOT NULL,
  is_default integer DEFAULT 0 NOT NULL,
  created_at integer DEFAULT (unixepoch()),
  updated_at integer DEFAULT (unixepoch())
);
CREATE INDEX membership_plans_slug_idx ON membership_plans (slug);
CREATE INDEX membership_plans_active_idx ON membership_plans (is_active);

CREATE TABLE subscriptions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership_plan_id integer REFERENCES membership_plans(id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text DEFAULT 'inactive' NOT NULL,
  current_period_start integer,
  current_period_end integer,
  cancel_at_period_end integer DEFAULT 0 NOT NULL,
  canceled_at integer,
  ended_at integer,
  grace_period_ends_at integer,
  created_at integer DEFAULT (unixepoch()),
  updated_at integer DEFAULT (unixepoch())
);
CREATE INDEX subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions (status);
CREATE INDEX subscriptions_stripe_subscription_id_idx ON subscriptions (stripe_subscription_id);

CREATE TABLE subscription_events (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  subscription_id integer REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_event_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  type text NOT NULL,
  payload_json text NOT NULL,
  processed_at integer DEFAULT (unixepoch()),
  created_at integer DEFAULT (unixepoch())
);
CREATE INDEX subscription_events_subscription_id_idx ON subscription_events (subscription_id);
CREATE INDEX subscription_events_type_idx ON subscription_events (type);
CREATE INDEX subscription_events_stripe_subscription_id_idx ON subscription_events (stripe_subscription_id);
