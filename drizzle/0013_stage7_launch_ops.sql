ALTER TABLE contact_messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'general';
ALTER TABLE contact_messages ADD COLUMN source_path TEXT;
ALTER TABLE contact_messages ADD COLUMN source TEXT;
ALTER TABLE contact_messages ADD COLUMN metadata_json TEXT;

CREATE TABLE IF NOT EXISTS beta_ops_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  contact_message_id INTEGER REFERENCES contact_messages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  publication_name TEXT,
  role TEXT,
  publication_type TEXT,
  current_stack TEXT,
  account_stage TEXT NOT NULL DEFAULT 'new_lead',
  onboarding_status TEXT NOT NULL DEFAULT 'not_started',
  priority TEXT NOT NULL DEFAULT 'medium',
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  source_path TEXT,
  source TEXT,
  next_follow_up_at INTEGER,
  last_contacted_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS beta_ops_accounts_email_idx ON beta_ops_accounts (email);
CREATE INDEX IF NOT EXISTS beta_ops_accounts_stage_idx ON beta_ops_accounts (account_stage);
CREATE INDEX IF NOT EXISTS beta_ops_accounts_owner_idx ON beta_ops_accounts (owner_user_id);
CREATE INDEX IF NOT EXISTS beta_ops_accounts_priority_idx ON beta_ops_accounts (priority);

CREATE TABLE IF NOT EXISTS beta_ops_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  beta_account_id INTEGER REFERENCES beta_ops_accounts(id) ON DELETE CASCADE,
  contact_message_id INTEGER REFERENCES contact_messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  source TEXT NOT NULL DEFAULT 'ops_manual',
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS beta_ops_feedback_account_idx ON beta_ops_feedback (beta_account_id);
CREATE INDEX IF NOT EXISTS beta_ops_feedback_status_idx ON beta_ops_feedback (status);
CREATE INDEX IF NOT EXISTS beta_ops_feedback_priority_idx ON beta_ops_feedback (priority);
