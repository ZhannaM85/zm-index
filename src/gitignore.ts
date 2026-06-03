import { existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const PATTERNS = ['.zm-index/', '*.zm-index.db'];

export function ensureGitignore(projectRoot: string): void {
  const gitignorePath = join(projectRoot, '.gitignore');
  if (!existsSync(gitignorePath)) return;

  const content = readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim());

  const missing = PATTERNS.filter(p => !lines.includes(p));
  if (missing.length === 0) return;

  const prefix = content.endsWith('\n') ? '' : '\n';
  appendFileSync(gitignorePath, `${prefix}${missing.join('\n')}\n`);
  console.log('✔ Added .zm-index/ to .gitignore');
}
