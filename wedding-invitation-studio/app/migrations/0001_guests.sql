CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  invite_type TEXT NOT NULL DEFAULT 'family',
  language TEXT NOT NULL DEFAULT 'english',
  events TEXT NOT NULL DEFAULT 'mandvo,haldi,sanji,marriage',
  pdf_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
