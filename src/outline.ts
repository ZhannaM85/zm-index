import { relative, resolve } from 'path';
import { openDb } from './db.js';

interface SymbolRow {
  name: string;
  kind: string;
  line: number;
  file: string;
}

export function outline(projectRoot: string, filePath?: string): void {
  if (!filePath) {
    outlineAll(projectRoot);
    return;
  }

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
    console.log(String(row.line).padStart(4) + '  ' + row.kind.padEnd(kindWidth + 2) + row.name);
  }
}

function outlineAll(projectRoot: string): void {
  const db = openDb(projectRoot);

  const rows = db.prepare(`
    SELECT name, kind, file, line
    FROM symbols
    ORDER BY file, line
  `).all() as SymbolRow[];

  db.close();

  if (rows.length === 0) {
    console.log('Index is empty — run zm-index rebuild first.');
    return;
  }

  const kindWidth = Math.max(...rows.map(r => r.kind.length));
  let currentFile = '';

  for (const row of rows) {
    const rel = relative(projectRoot, row.file).replace(/\\/g, '/');
    if (rel !== currentFile) {
      console.log(`\n${rel}`);
      currentFile = rel;
    }
    console.log(String(row.line).padStart(4) + '  ' + row.kind.padEnd(kindWidth + 2) + row.name);
  }

  const fileCount = new Set(rows.map(r => r.file)).size;
  console.log('');
  console.log(`  zm-index analyzed ${fileCount} file${fileCount !== 1 ? 's' : ''} and discovered ${rows.length} symbol${rows.length !== 1 ? 's' : ''}`);
  console.log(`  Your codebase is indexed and ready to search.`);
}
