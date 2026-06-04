import { existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const SNIPPET = `
## Code Search
- ALWAYS use \`zm-index search\` FIRST for any code search task
- Run \`zm-index outline <file>\` BEFORE reading any file longer than 500 lines
- Only fall back to grep if zm-index returns empty results

### Commands
- \`zm-index search "SymbolName"\`      # find any symbol
- \`zm-index outline path/to/file\`      # file structure before reading
- \`zm-index usages "SymbolName"\`      # find references
- \`zm-index callers "functionName"\`   # find call sites
- \`zm-index stats\`                     # check index health
`.trimStart();

export function init(projectRoot: string, write: boolean): void {
  console.log(SNIPPET);

  if (!write) return;

  const claudeMdPath = join(projectRoot, 'CLAUDE.md');
  const exists = existsSync(claudeMdPath);
  const current = exists ? readFileSync(claudeMdPath, 'utf8') : '';

  if (current.includes('zm-index search')) {
    console.log('CLAUDE.md already contains a zm-index section — skipping write.');
    return;
  }

  const prefix = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
  appendFileSync(claudeMdPath, `${prefix}${SNIPPET}`);
  console.log(`✔ Appended zm-index snippet to ${claudeMdPath}`);
}
