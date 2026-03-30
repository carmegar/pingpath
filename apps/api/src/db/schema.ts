import { createClient, type Client } from '@libsql/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/pingpath.db')

let client: Client

export function getDb(): Client {
  if (!client) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    client = createClient({ url: `file:${DB_PATH}` })
  }
  return client
}

export async function initDatabase(): Promise<void> {
  const db = getDb()

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS monitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET',
      interval_seconds INTEGER NOT NULL DEFAULT 60,
      expected_status INTEGER NOT NULL DEFAULT 200,
      timeout_ms INTEGER NOT NULL DEFAULT 5000,
      is_public INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
      status_code INTEGER,
      latency_ms INTEGER NOT NULL,
      error_message TEXT,
      checked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_checks_monitor_id ON checks(monitor_id);
    CREATE INDEX IF NOT EXISTS idx_checks_checked_at ON checks(checked_at);
    CREATE INDEX IF NOT EXISTS idx_checks_monitor_checked ON checks(monitor_id, checked_at DESC);

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('down', 'degraded', 'recovery')),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      duration_seconds INTEGER,
      ai_summary TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_monitor_id ON incidents(monitor_id);

    CREATE TABLE IF NOT EXISTS notification_channels (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('discord', 'telegram')),
      config TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS monitor_notifications (
      monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
      channel_id TEXT NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
      PRIMARY KEY (monitor_id, channel_id)
    );

    PRAGMA foreign_keys = ON;
  `)
}
