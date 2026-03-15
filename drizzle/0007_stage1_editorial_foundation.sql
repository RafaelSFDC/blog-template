ALTER TABLE media ADD COLUMN owner_id text REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE post_revisions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  meta_title text,
  meta_description text,
  og_image text,
  is_premium integer DEFAULT 0,
  status text NOT NULL,
  published_at integer,
  category_ids_snapshot text DEFAULT '[]' NOT NULL,
  tag_ids_snapshot text DEFAULT '[]' NOT NULL,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  source text DEFAULT 'manual' NOT NULL,
  created_at integer DEFAULT (unixepoch())
);
CREATE INDEX post_revisions_post_id_idx ON post_revisions (post_id);
CREATE INDEX post_revisions_created_at_idx ON post_revisions (created_at);

CREATE TABLE page_revisions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  page_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text NOT NULL,
  meta_title text,
  meta_description text,
  og_image text,
  status text NOT NULL,
  is_home integer DEFAULT 0 NOT NULL,
  published_at integer,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  source text DEFAULT 'manual' NOT NULL,
  created_at integer DEFAULT (unixepoch())
);
CREATE INDEX page_revisions_page_id_idx ON page_revisions (page_id);
CREATE INDEX page_revisions_created_at_idx ON page_revisions (created_at);

CREATE TABLE activity_logs (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  summary text NOT NULL,
  metadata_json text,
  created_at integer DEFAULT (unixepoch())
);
CREATE INDEX activity_logs_actor_user_id_idx ON activity_logs (actor_user_id);
CREATE INDEX activity_logs_entity_idx ON activity_logs (entity_type, entity_id);
CREATE INDEX activity_logs_created_at_idx ON activity_logs (created_at);

CREATE TABLE invitations (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  invited_by text REFERENCES users(id) ON DELETE SET NULL,
  expires_at integer NOT NULL,
  accepted_at integer,
  revoked_at integer,
  created_at integer DEFAULT (unixepoch())
);
CREATE INDEX invitations_email_idx ON invitations (email);
CREATE INDEX invitations_expires_at_idx ON invitations (expires_at);

CREATE TABLE content_locks (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acquired_at integer DEFAULT (unixepoch()),
  expires_at integer NOT NULL,
  last_heartbeat_at integer DEFAULT (unixepoch())
);
CREATE INDEX content_locks_entity_idx ON content_locks (entity_type, entity_id);
CREATE INDEX content_locks_user_id_idx ON content_locks (user_id);
CREATE INDEX content_locks_expires_at_idx ON content_locks (expires_at);
