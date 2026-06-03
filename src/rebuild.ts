import { readFileSync } from 'fs';
import { openDb } from './db.js';
import { extractSymbols } from './extractor.js';
import { parse } from './parser.js';
import { scanProject } from './scanner.js';

export function rebuild(projectRoot: string): void {
  const start = performance.now();

  const db = openDb(projectRoot);

  // clear existing index
  db.exec('DELETE FROM symbols_fts; DELETE FROM symbols; DELETE FROM files;');

  const files = scanProject(projectRoot);

  const insertFile = db.prepare(
    'INSERT OR REPLACE INTO files (path, mtime, size) VALUES (?, ?, ?)'
  );
  const insertSymbol = db.prepare(
    'INSERT INTO symbols (name, kind, file, line) VALUES (?, ?, ?, ?)'
  );

  let symbolCount = 0;
  let skipped = 0;

  const runAll = db.transaction(() => {
    for (const file of files) {
      let source: string;
      try {
        source = readFileSync(file.path, 'utf8');
      } catch {
        skipped++;
        continue;
      }

      const parsed = parse(file.path, source);
      if (!parsed) { skipped++; continue; }

      const symbols = extractSymbols(parsed.tree.rootNode, file.path);

      insertFile.run(file.path, file.mtime, file.size);
      for (const sym of symbols) {
        insertSymbol.run(sym.name, sym.kind, sym.file, sym.line);
        symbolCount++;
      }
    }
  });

  runAll();
  db.close();

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);
  const indexed = files.length - skipped;

  console.log(`✔ Indexed ${indexed} file${indexed !== 1 ? 's' : ''}, ${symbolCount} symbol${symbolCount !== 1 ? 's' : ''} in ${elapsed}s`);
  if (skipped > 0) console.log(`  (${skipped} file${skipped !== 1 ? 's' : ''} skipped due to errors)`);
}
