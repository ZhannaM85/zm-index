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

export function rebuild(projectRoot: string, verbose = false): void {
  const start = performance.now();

  const db = openDb(projectRoot);

  // load what's currently in the DB
  const storedFiles = new Map<string, StoredFile>(
    (db.prepare('SELECT path, mtime, size FROM files').all() as StoredFile[])
      .map(f => [f.path, f])
  );

  const scanStart = performance.now();
  const scannedFiles = scanProject(projectRoot);
  const scanMs = performance.now() - scanStart;

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
  let totalParseMs = 0;
  let parsedFileCount = 0;

  const txStart = performance.now();
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

      const parseStart = performance.now();
      const parsed = parse(file.path, source);
      totalParseMs += performance.now() - parseStart;
      parsedFileCount++;

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
  const txMs = performance.now() - txStart;
  db.close();

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  const parts: string[] = [];
  if (updated > 0)   parts.push(`${updated} updated`);
  if (unchanged > 0) parts.push(`${unchanged} unchanged`);
  if (deleted > 0)   parts.push(`${deleted} deleted`);
  if (errors > 0)    parts.push(`${errors} errored`);

  const totalFiles = scannedFiles.length - errors;
  console.log('');
  console.log(`  ✔ zm-index analyzed ${totalFiles} file${totalFiles !== 1 ? 's' : ''} and discovered ${symbolCount} symbol${symbolCount !== 1 ? 's' : ''} in ${elapsed}s`);
  console.log(`  Your codebase is indexed and ready to search.`);
  console.log('');
  console.log(`  Files: ${parts.join(' · ')}`);
  if (errors > 0) console.log(`  Skipped: ${errors} file${errors !== 1 ? 's' : ''} (too large or unreadable)`);

  if (verbose) {
    const dbWriteMs = txMs - totalParseMs;
    const avgParseMs = parsedFileCount > 0 ? (totalParseMs / parsedFileCount).toFixed(1) : '0.0';
    console.log('');
    console.log('Stage breakdown:');
    console.log(`  File scan  ${scanMs.toFixed(0).padStart(6)} ms  (${scannedFiles.length} files)`);
    console.log(`  Parse      ${totalParseMs.toFixed(0).padStart(6)} ms  (${avgParseMs} ms/file avg, ${parsedFileCount} parsed)`);
    console.log(`  DB write   ${dbWriteMs.toFixed(0).padStart(6)} ms`);
  }
}
