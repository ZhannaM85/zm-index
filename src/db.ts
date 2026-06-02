import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { env, platform } from 'process';

function cacheDir(): string {
  if (platform === 'win32') {
    return join(env.LOCALAPPDATA ?? join(env.USERPROFILE ?? 'C:\\Users\\Default', 'AppData', 'Local'), 'zm-index');
  }
  return join(env.XDG_CACHE_HOME ?? join(env.HOME ?? '~', '.cache'), 'zm-index');
}

function dbPath(projectRoot: string): string {
  const hash = createHash('sha1').update(projectRoot).digest('hex').slice(0, 8);
  const dir = cacheDir();
  mkdirSync(dir, { recursive: true });
  return join(dir, `${hash}.db`);
}

export function openDb(projectRoot: string): Database.Database {
  const db = new Database(dbPath(projectRoot));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      path  TEXT PRIMARY KEY,
      mtime INTEGER NOT NULL,
      size  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS symbols (
      id    INTEGER PRIMARY KEY,
      name  TEXT NOT NULL,
      kind  TEXT NOT NULL,
      file  TEXT NOT NULL,
      line  INTEGER NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS symbols_fts
      USING fts5(name, kind, file, content=symbols, content_rowid=id);

    CREATE TRIGGER IF NOT EXISTS symbols_ai AFTER INSERT ON symbols BEGIN
      INSERT INTO symbols_fts(rowid, name, kind, file) VALUES (new.id, new.name, new.kind, new.file);
    END;

    CREATE TRIGGER IF NOT EXISTS symbols_ad AFTER DELETE ON symbols BEGIN
      INSERT INTO symbols_fts(symbols_fts, rowid, name, kind, file) VALUES ('delete', old.id, old.name, old.kind, old.file);
    END;
  `);
  return db;
}

export function getDbPath(projectRoot: string): string {
  return dbPath(projectRoot);
}
