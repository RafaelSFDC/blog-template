ALTER TABLE users ADD COLUMN public_author_slug text;
ALTER TABLE users ADD COLUMN author_bio text;
ALTER TABLE users ADD COLUMN author_headline text;
ALTER TABLE users ADD COLUMN author_seo_title text;
ALTER TABLE users ADD COLUMN author_seo_description text;
CREATE UNIQUE INDEX IF NOT EXISTS users_public_author_slug_unique ON users(public_author_slug);

ALTER TABLE categories ADD COLUMN seo_no_index integer NOT NULL DEFAULT 0;
ALTER TABLE tags ADD COLUMN seo_no_index integer NOT NULL DEFAULT 0;

ALTER TABLE media ADD COLUMN width integer;
ALTER TABLE media ADD COLUMN height integer;
ALTER TABLE media ADD COLUMN placeholder_data text;
ALTER TABLE media ADD COLUMN variants_json text;

ALTER TABLE posts ADD COLUMN seo_no_index integer NOT NULL DEFAULT 0;
ALTER TABLE pages ADD COLUMN seo_no_index integer NOT NULL DEFAULT 0;
ALTER TABLE post_revisions ADD COLUMN seo_no_index integer NOT NULL DEFAULT 0;
ALTER TABLE page_revisions ADD COLUMN seo_no_index integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at);
CREATE INDEX IF NOT EXISTS posts_editor_owner_id_idx ON posts(editor_owner_id);
