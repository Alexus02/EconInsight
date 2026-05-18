CREATE TABLE IF NOT EXISTS admin_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_type TEXT NOT NULL CHECK (message_type IN ('contact', 'booking')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT,
  requested_at TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  email_delivery_status TEXT,
  email_delivery_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_type_created ON admin_messages(message_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_messages_status_created ON admin_messages(status, created_at DESC);