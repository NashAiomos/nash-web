CREATE TABLE guests (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_path TEXT NOT NULL,
  guest_id TEXT NOT NULL REFERENCES guests(id),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 3000),
  created_at INTEGER NOT NULL
);

CREATE INDEX comments_post_date ON comments(post_path, created_at DESC, id DESC);
CREATE INDEX comments_guest ON comments(guest_id);

CREATE TABLE rate_limits (
  rate_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE INDEX rate_limits_reset ON rate_limits(reset_at);
