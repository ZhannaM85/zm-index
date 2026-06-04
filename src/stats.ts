import { statSync } from 'fs';
import { openDb, getDbPath } from './db.js';

export function stats(projectRoot: string): void {
  const dbPath = getDbPath(projectRoot);
  const db = openDb(projectRoot);

  const fileCount = (db.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number }).count;
  const symbolCount = (db.prepare('SELECT COUNT(*) as count FROM symbols').get() as { count: number }).count;
  db.close();

  if (fileCount === 0) {
    console.log('Index is empty — run zm-index rebuild first.');
    return;
  }

  let dbSizeStr = '—';
  let updatedStr = '—';
  try {
    const s = statSync(dbPath);
    const bytes = s.size;
    dbSizeStr = bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    updatedStr = s.mtime.toISOString().slice(0, 16).replace('T', ' ');
  } catch {
    // db file missing — leave defaults
  }

  console.log(`Project:   ${projectRoot}`);
  console.log(`Files:     ${fileCount}`);
  console.log(`Symbols:   ${symbolCount.toLocaleString('en-US')}`);
  console.log(`DB size:   ${dbSizeStr}`);
  console.log(`Updated:   ${updatedStr}`);
}
