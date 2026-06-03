import { relative } from 'path';
import { openDb } from './db.js';

interface SymbolRow {
  name: string;
  kind: string;
  file: string;
  line: number;
}

export function search(projectRoot: string, query: string): void {
  const db = openDb(projectRoot);

  // try FTS5 prefix match first (fast, O(log n))
  let rows = db.prepare(`
    SELECT s.name, s.kind, s.file, s.line
    FROM symbols s
    WHERE s.id IN (SELECT rowid FROM symbols_fts WHERE name MATCH ?)
    ORDER BY s.file, s.line
  `).all(`${query}*`) as SymbolRow[];

  // fall back to substring match if prefix found nothing
  if (rows.length === 0) {
    rows = db.prepare(`
      SELECT name, kind, file, line
      FROM symbols
      WHERE name LIKE ?
      ORDER BY file, line
    `).all(`%${query}%`) as SymbolRow[];
  }

  db.close();

  if (rows.length === 0) {
    console.log(`No symbols found matching "${query}"`);
    return;
  }

  const kindWidth = Math.max(...rows.map(r => r.kind.length));
  const nameWidth = Math.max(...rows.map(r => r.name.length));

  for (const row of rows) {
    const rel = relative(projectRoot, row.file).replace(/\\/g, '/');
    console.log(
      row.kind.padEnd(kindWidth + 2) +
      row.name.padEnd(nameWidth + 2) +
      `${rel}:${row.line}`
    );
  }
}
