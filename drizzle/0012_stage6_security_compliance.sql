ALTER TABLE posts ADD COLUMN comments_enabled integer NOT NULL DEFAULT 1;

ALTER TABLE comments ADD COLUMN source_ip_hash text;
ALTER TABLE comments ADD COLUMN user_agent text;
ALTER TABLE comments ADD COLUMN spam_reason text;

CREATE TABLE IF NOT EXISTS newsletter_consents (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  subscriber_id integer REFERENCES subscribers(id) ON DELETE SET NULL,
  email text NOT NULL,
  source text,
  status text NOT NULL,
  lawful_basis text NOT NULL DEFAULT 'consent',
  ip_hash text,
  user_agent text,
  created_at integer DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS newsletter_consents_subscriber_id_idx ON newsletter_consents(subscriber_id);
CREATE INDEX IF NOT EXISTS newsletter_consents_email_idx ON newsletter_consents(email);
CREATE INDEX IF NOT EXISTS newsletter_consents_status_idx ON newsletter_consents(status);
CREATE INDEX IF NOT EXISTS newsletter_consents_created_at_idx ON newsletter_consents(created_at);

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  scope text NOT NULL,
  identifier_hash text NOT NULL,
  key_json text,
  created_at integer DEFAULT CURRENT_TIMESTAMP,
  expires_at integer NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limit_events_scope_identifier_idx ON rate_limit_events(scope, identifier_hash);
CREATE INDEX IF NOT EXISTS rate_limit_events_expires_at_idx ON rate_limit_events(expires_at);
CREATE INDEX IF NOT EXISTS rate_limit_events_created_at_idx ON rate_limit_events(created_at);

CREATE TABLE IF NOT EXISTS security_events (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  type text NOT NULL,
  scope text,
  identifier_hash text,
  ip_hash text,
  user_agent text,
  metadata_json text,
  created_at integer DEFAULT CURRENT_TIMESTAMP,
  expires_at integer
);
CREATE INDEX IF NOT EXISTS security_events_type_idx ON security_events(type);
CREATE INDEX IF NOT EXISTS security_events_scope_idx ON security_events(scope);
CREATE INDEX IF NOT EXISTS security_events_expires_at_idx ON security_events(expires_at);
CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON security_events(created_at);
