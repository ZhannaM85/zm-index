import ignore, { Ignore } from 'ignore';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

export interface FileEntry {
  path: string;
  mtime: number;
  size: number;
}

const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte',
]);

const ALWAYS_SKIP = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt',
]);

function loadGitignore(projectRoot: string): Ignore {
  const ig = ignore();
  try {
    const content = readFileSync(join(projectRoot, '.gitignore'), 'utf8');
    ig.add(content);
  } catch {
    // no .gitignore — that's fine
  }
  return ig;
}

function walk(dir: string, projectRoot: string, ig: Ignore, results: FileEntry[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (ALWAYS_SKIP.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    const relPath = relative(projectRoot, fullPath).replace(/\\/g, '/');

    if (ig.ignores(relPath)) continue;

    if (entry.isDirectory()) {
      walk(fullPath, projectRoot, ig, results);
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'));
      if (!SUPPORTED_EXTENSIONS.has(ext)) continue;
      try {
        const stat = statSync(fullPath);
        results.push({ path: fullPath, mtime: stat.mtimeMs, size: stat.size });
      } catch {
        // file disappeared between readdir and stat — skip it
      }
    }
  }
}

export function scanProject(projectRoot: string): FileEntry[] {
  const ig = loadGitignore(projectRoot);
  const results: FileEntry[] = [];
  walk(projectRoot, projectRoot, ig, results);
  return results;
}
