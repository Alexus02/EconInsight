CREATE TABLE IF NOT EXISTS uploaded_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploader_id TEXT,
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT,
  file_size INTEGER,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploader ON uploaded_files(uploader_id);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_type TEXT NOT NULL CHECK (post_type IN ('article', 'blog')),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  article_file_url TEXT,
  article_storage_key TEXT,
  cover_image_url TEXT,
  author_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_type_status_created ON posts(post_type, status, created_at DESC);
