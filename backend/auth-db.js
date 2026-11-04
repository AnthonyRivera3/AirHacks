// AirHacks private, invite-only accounts database.
// Install: npm install better-sqlite3 nodemailer
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dbPath = path.resolve(
  __dirname,
  process.env.AUTH_DB_PATH || "data/airhacks-auth.sqlite"
);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_challenges (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    attempt_key TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS login_attempts_key_time
    ON login_attempts(attempt_key, created_at);
`);

module.exports = { db };