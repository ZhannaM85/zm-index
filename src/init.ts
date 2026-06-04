import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CLAUDE_SNIPPET = `## Code Search
- ALWAYS use \`zm-index search\` FIRST for any code search task
- Run \`zm-index outline <file>\` BEFORE reading any file longer than 500 lines
- Only fall back to grep if zm-index returns empty results

### Commands
- \`zm-index search "SymbolName"\`      # find any symbol
- \`zm-index outline path/to/file\`     # file structure before reading
- \`zm-index usages "SymbolName"\`      # find references
- \`zm-index callers "functionName"\`   # find call sites
- \`zm-index stats\`                    # check index health
`;

const CURSOR_MDC_CONTENT = `---
description: Use zm-index for all code search tasks
alwaysApply: true
---

## Code Search
- ALWAYS use \`zm-index search\` FIRST for any code search task
- Run \`zm-index outline <file>\` BEFORE reading any file longer than 500 lines
- Only fall back to grep if zm-index returns empty results

### Commands
- \`zm-index search "SymbolName"\`      # find any symbol
- \`zm-index outline path/to/file\`     # file structure before reading
- \`zm-index usages "SymbolName"\`      # find references
- \`zm-index callers "functionName"\`   # find call sites
- \`zm-index stats\`                    # check index health
`;

export function init(projectRoot: string, write: boolean, cursor: boolean): void {
  if (cursor) {
    const rulesDir = join(projectRoot, '.cursor', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    writeFileSync(join(rulesDir, 'zm-index.mdc'), CURSOR_MDC_CONTENT, 'utf8');
    console.log(`✔ Written .cursor/rules/zm-index.mdc`);
    return;
  }

  console.log(CLAUDE_SNIPPET);

  if (!write) return;

  const claudeMdPath = join(projectRoot, 'CLAUDE.md');
  const current = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, 'utf8') : '';

  if (current.includes('zm-index search')) {
    console.log('CLAUDE.md already contains a zm-index section — skipping write.');
    return;
  }

  const prefix = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
  appendFileSync(claudeMdPath, `${prefix}${CLAUDE_SNIPPET}`);
  console.log(`✔ Appended zm-index snippet to ${claudeMdPath}`);
}
