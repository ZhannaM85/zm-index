import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { openDb, getDbPath } from '../../src/db.ts';

const TEST_ROOT = join(tmpdir(), `zm-index-db-test-${Date.now()}`);

after(() => {
  const dbPath = getDbPath(TEST_ROOT);
  if (existsSync(dbPath)) rmSync(dbPath);
});

test('openDb creates files, symbols, and symbols_fts tables on a fresh DB', () => {
  const db = openDb(TEST_ROOT);
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map(r => r.name);
  assert.ok(tables.includes('files'), 'files table missing');
  assert.ok(tables.includes('symbols'), 'symbols table missing');
  assert.ok(tables.includes('symbols_fts'), 'symbols_fts virtual table missing');
  db.close();
});

test('inserting a symbol makes it findable via FTS5 search', () => {
  const db = openDb(TEST_ROOT);
  db.prepare('INSERT INTO symbols (name, kind, file, line) VALUES (?, ?, ?, ?)').run('MyClass', 'class', '/tmp/foo.ts', 1);
  const row = db.prepare("SELECT rowid FROM symbols_fts WHERE name MATCH ?").get('MyClass');
  assert.ok(row, 'symbol not found in FTS5 index after insert');
  db.close();
});

test('deleting a symbol removes it from the FTS5 index', () => {
  const db = openDb(TEST_ROOT);
  const result = db.prepare('INSERT INTO symbols (name, kind, file, line) VALUES (?, ?, ?, ?)').run('TempSymbol', 'function', '/tmp/bar.ts', 5);
  const id = result.lastInsertRowid;

  // confirm it is findable before deletion
  const before = db.prepare("SELECT rowid FROM symbols_fts WHERE name MATCH ?").get('TempSymbol');
  assert.ok(before, 'symbol not found before deletion');

  db.prepare('DELETE FROM symbols WHERE id = ?').run(id);

  const after = db.prepare("SELECT rowid FROM symbols_fts WHERE name MATCH ?").get('TempSymbol');
  assert.equal(after, undefined, 'symbol still present in FTS5 index after deletion');
  db.close();
});
