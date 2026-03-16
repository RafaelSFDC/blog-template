ALTER TABLE subscribers ADD COLUMN source text;
ALTER TABLE subscribers ADD COLUMN confirmed_at integer;
ALTER TABLE subscribers ADD COLUMN unsubscribed_at integer;
ALTER TABLE subscribers ADD COLUMN last_email_sent_at integer;
ALTER TABLE subscribers ADD COLUMN last_opened_at integer;
ALTER TABLE subscribers ADD COLUMN last_clicked_at integer;

ALTER TABLE newsletters ADD COLUMN preheader text;
ALTER TABLE newsletters ADD COLUMN segment text DEFAULT 'all_active' NOT NULL;
ALTER TABLE newsletters ADD COLUMN scheduled_at integer;
ALTER TABLE newsletters ADD COLUMN queued_at integer;
ALTER TABLE newsletters ADD COLUMN sending_started_at integer;
ALTER TABLE newsletters ADD COLUMN sending_completed_at integer;
ALTER TABLE newsletters ADD COLUMN canceled_at integer;
ALTER TABLE newsletters ADD COLUMN total_recipients integer DEFAULT 0 NOT NULL;
ALTER TABLE newsletters ADD COLUMN sent_count integer DEFAULT 0 NOT NULL;
ALTER TABLE newsletters ADD COLUMN failed_count integer DEFAULT 0 NOT NULL;
ALTER TABLE newsletters ADD COLUMN open_count integer DEFAULT 0 NOT NULL;
ALTER TABLE newsletters ADD COLUMN click_count integer DEFAULT 0 NOT NULL;

CREATE TABLE newsletter_deliveries (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  newsletter_id integer NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id integer NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  subscriber_email text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  resend_email_id text,
  last_event_id text,
  attempt_count integer DEFAULT 0 NOT NULL,
  last_error text,
  sent_at integer,
  delivered_at integer,
  opened_at integer,
  clicked_at integer,
  bounced_at integer,
  complained_at integer,
  failed_at integer,
  last_attempt_at integer,
  created_at integer DEFAULT (unixepoch()),
  updated_at integer DEFAULT (unixepoch())
);
CREATE INDEX newsletter_deliveries_newsletter_id_idx ON newsletter_deliveries (newsletter_id);
CREATE INDEX newsletter_deliveries_subscriber_id_idx ON newsletter_deliveries (subscriber_id);
CREATE INDEX newsletter_deliveries_status_idx ON newsletter_deliveries (status);
CREATE INDEX newsletter_deliveries_resend_email_id_idx ON newsletter_deliveries (resend_email_id);

CREATE TABLE subscriber_events (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  subscriber_id integer NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  type text NOT NULL,
  metadata_json text,
  created_at integer DEFAULT (unixepoch())
);
CREATE INDEX subscriber_events_subscriber_id_idx ON subscriber_events (subscriber_id);
CREATE INDEX subscriber_events_type_idx ON subscriber_events (type);
CREATE INDEX subscriber_events_created_at_idx ON subscriber_events (created_at);
