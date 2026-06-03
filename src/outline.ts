import { resolve } from 'path';
import { openDb } from './db.js';

interface SymbolRow {
  name: string;
  kind: string;
  line: number;
}

export function outline(projectRoot: string, filePath: string): void {
  const absPath = resolve(filePath);
  const db = openDb(projectRoot);

  const rows = db.prepare(`
    SELECT name, kind, line
    FROM symbols
    WHERE file = ?
    ORDER BY line
  `).all(absPath) as SymbolRow[];

  db.close();

  if (rows.length === 0) {
    console.log(`No symbols found in "${filePath}" — is the file indexed? Run zm-index rebuild.`);
    return;
  }

  const kindWidth = Math.max(...rows.map(r => r.kind.length));

  for (const row of rows) {
    console.log(
      String(row.line).padStart(4) + '  ' +
      row.kind.padEnd(kindWidth + 2) +
      row.name
    );
  }
}
