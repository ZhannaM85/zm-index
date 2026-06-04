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

const SETTINGS_SNIPPET_WINDOWS = `{
  "hooks": {
    "SessionStart": [{
      "command": "zm-index stats >nul 2>&1 || zm-index rebuild"
    }]
  }
}`;

const SETTINGS_SNIPPET_UNIX = `{
  "hooks": {
    "SessionStart": [{
      "command": "zm-index stats >/dev/null 2>&1 || zm-index rebuild"
    }]
  }
}`;

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

  const isWindows = process.platform === 'win32';
  console.log(`
---
## Auto-rebuild on session start (optional)

Add to \`.claude/settings.json\` in your project:

\`\`\`json
${isWindows ? SETTINGS_SNIPPET_WINDOWS : SETTINGS_SNIPPET_UNIX}
\`\`\`
${isWindows
    ? '> On Linux/Mac use `>/dev/null` instead of `>nul`.'
    : '> On Windows use `>nul` instead of `>/dev/null`.'}

To keep \`.claude/settings.json\` out of version control:

  echo ".claude/settings.json" >> .git/info/exclude
`);

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
