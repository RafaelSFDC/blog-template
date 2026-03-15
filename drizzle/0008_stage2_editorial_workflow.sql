ALTER TABLE posts ADD COLUMN editor_owner_id text REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN review_requested_at integer;
ALTER TABLE posts ADD COLUMN review_requested_by text REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN last_reviewed_at integer;
ALTER TABLE posts ADD COLUMN last_reviewed_by text REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN approved_at integer;
ALTER TABLE posts ADD COLUMN approved_by text REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN scheduled_at integer;
ALTER TABLE posts ADD COLUMN archived_at integer;

UPDATE posts
SET status = 'archived',
    archived_at = COALESCE(updated_at, unixepoch())
WHERE status = 'private';

CREATE INDEX posts_status_idx ON posts (status);
CREATE INDEX posts_author_id_idx ON posts (author_id);
CREATE INDEX posts_editor_owner_id_idx ON posts (editor_owner_id);
CREATE INDEX posts_published_at_idx ON posts (published_at);
CREATE INDEX posts_scheduled_at_idx ON posts (scheduled_at);

CREATE TABLE editorial_comments (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  resolved_at integer,
  resolved_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at integer DEFAULT (unixepoch())
);
CREATE INDEX editorial_comments_post_id_idx ON editorial_comments (post_id);
CREATE INDEX editorial_comments_author_user_id_idx ON editorial_comments (author_user_id);
CREATE INDEX editorial_comments_resolved_at_idx ON editorial_comments (resolved_at);

CREATE TABLE editorial_checklists (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  is_completed integer DEFAULT 0 NOT NULL,
  completed_at integer,
  completed_by text REFERENCES users(id) ON DELETE SET NULL,
  updated_at integer DEFAULT (unixepoch())
);
CREATE INDEX editorial_checklists_post_id_idx ON editorial_checklists (post_id);
CREATE INDEX editorial_checklists_post_item_idx ON editorial_checklists (post_id, item_key);
