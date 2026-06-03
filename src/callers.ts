import { readFileSync } from 'fs';
import { relative } from 'path';
import { openDb } from './db.js';

interface FileRow {
  path: string;
}

interface Caller {
  file: string;
  line: number;
  text: string;
}

export function callers(projectRoot: string, fnName: string): void {
  const db = openDb(projectRoot);
  const files = db.prepare('SELECT path FROM files ORDER BY path').all() as FileRow[];
  db.close();

  if (files.length === 0) {
    console.log('Index is empty — run zm-index rebuild first.');
    return;
  }

  // match call expressions: name( or name  ( — excludes imports, type refs, assignments
  const pattern = new RegExp(`\\b${escapeRegex(fnName)}\\s*\\(`, 'g');
  const results: Caller[] = [];

  for (const { path } of files) {
    let content: string;
    try {
      content = readFileSync(path, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        results.push({ file: path, line: i + 1, text: lines[i].trim() });
      }
      pattern.lastIndex = 0;
    }
  }

  if (results.length === 0) {
    console.log(`No call sites found for "${fnName}"`);
    return;
  }

  let currentFile = '';
  for (const r of results) {
    const rel = relative(projectRoot, r.file).replace(/\\/g, '/');
    if (rel !== currentFile) {
      console.log(`\n${rel}`);
      currentFile = rel;
    }
    console.log(`  ${String(r.line).padStart(4)}  ${r.text}`);
  }
  console.log(`\n${results.length} call site${results.length !== 1 ? 's' : ''} found`);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
