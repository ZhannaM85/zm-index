import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

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
- \`zm-index outline path/to/file\`      # file structure before reading
- \`zm-index usages "SymbolName"\`      # find references
- \`zm-index callers "functionName"\`   # find call sites
- \`zm-index stats\`                     # check index health
`;

const CLAUDE_MD_SNIPPET = `## Code Search
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

export function printClaudeSnippet(): void {
  console.log(CLAUDE_MD_SNIPPET);
}

export function writeCursorRules(projectRoot: string): void {
  const rulesDir = join(projectRoot, '.cursor', 'rules');
  const rulesFile = join(rulesDir, 'zm-index.mdc');

  mkdirSync(rulesDir, { recursive: true });
  writeFileSync(rulesFile, CURSOR_MDC_CONTENT, 'utf8');
  console.log(`✔ Written .cursor/rules/zm-index.mdc`);
}
