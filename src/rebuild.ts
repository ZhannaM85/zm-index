import { readFileSync } from 'fs';
import { openDb } from './db.js';
import { extractSymbols } from './extractor.js';
import { parse } from './parser.js';
import { scanProject } from './scanner.js';

interface StoredFile {
  path: string;
  mtime: number;
  size: number;
}

export function rebuild(projectRoot: string): void {
  const start = performance.now();

  const db = openDb(projectRoot);

  // load what's currently in the DB
  const storedFiles = new Map<string, StoredFile>(
    (db.prepare('SELECT path, mtime, size FROM files').all() as StoredFile[])
      .map(f => [f.path, f])
  );

  const scannedFiles = scanProject(projectRoot);
  const scannedPaths = new Set(scannedFiles.map(f => f.path));

  const insertFile = db.prepare(
    'INSERT OR REPLACE INTO files (path, mtime, size) VALUES (?, ?, ?)'
  );
  const insertSymbol = db.prepare(
    'INSERT INTO symbols (name, kind, file, line) VALUES (?, ?, ?, ?)'
  );
  const deleteFileSymbols = db.prepare(
    'DELETE FROM symbols WHERE file = ?'
  );
  const deleteFile = db.prepare(
    'DELETE FROM files WHERE path = ?'
  );

  let updated = 0;
  let unchanged = 0;
  let deleted = 0;
  let errors = 0;
  let symbolCount = 0;

  const runAll = db.transaction(() => {
    // remove deleted files
    for (const [path, _] of storedFiles) {
      if (!scannedPaths.has(path)) {
        deleteFileSymbols.run(path);
        deleteFile.run(path);
        deleted++;
      }
    }

    // update new or changed files
    for (const file of scannedFiles) {
      const stored = storedFiles.get(file.path);
      if (stored && stored.mtime === file.mtime && stored.size === file.size) {
        unchanged++;
        continue;
      }

      let source: string;
      try {
        source = readFileSync(file.path, 'utf8');
      } catch {
        errors++;
        continue;
      }

      const parsed = parse(file.path, source);
      if (!parsed) { errors++; continue; }

      const symbols = extractSymbols(parsed.tree.rootNode, file.path);

      // remove old symbols for this file before re-inserting
      deleteFileSymbols.run(file.path);
      insertFile.run(file.path, file.mtime, file.size);
      for (const sym of symbols) {
        insertSymbol.run(sym.name, sym.kind, sym.file, sym.line);
        symbolCount++;
      }
      updated++;
    }

    // count total symbols for summary
    symbolCount = (db.prepare('SELECT COUNT(*) as count FROM symbols').get() as { count: number }).count;
  });

  runAll();
  db.close();

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  const parts: string[] = [];
  if (updated > 0)   parts.push(`${updated} updated`);
  if (unchanged > 0) parts.push(`${unchanged} unchanged`);
  if (deleted > 0)   parts.push(`${deleted} deleted`);
  if (errors > 0)    parts.push(`${errors} errored`);

  console.log(`✔ ${parts.join(', ')} — ${symbolCount} symbol${symbolCount !== 1 ? 's' : ''} total (${elapsed}s)`);
}
