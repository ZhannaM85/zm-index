# zm-index

Fast local code symbol index for AI coding assistants. Built by Zhanna Myshkovskaya.

zm-index scans your codebase, extracts symbols (classes, functions, interfaces, methods), and stores them in a local SQLite database. Instead of reading whole files, AI agents like Claude Code can query the index and get precise results in milliseconds — saving tokens and time on large projects.

**All data stays local.** The index is stored in your OS cache directory and never touches your source files or leaves your machine.

---

## Installation

```sh
npm install -g zm-index
```

---

## Quick start

```sh
cd your-project
zm-index rebuild        # build the index
zm-index search User    # find symbols matching "User"
```

---

## Commands

| Command | Description |
|---------|-------------|
| `zm-index rebuild` | Scan the project and build the symbol index from scratch |
| `zm-index search <symbol>` | Find any symbol by name (supports partial match) |
| `zm-index outline <file>` | List all symbols defined in a file, sorted by line |
| `zm-index usages <symbol>` | Find all references to a symbol |
| `zm-index callers <function>` | Find all call sites of a function |
| `zm-index stats` | Show file count, symbol count, DB size, last updated |
| `zm-index db-path` | Print the path to the local index database |
| `zm-index init` | Print a CLAUDE.md snippet to enable zm-index in this project |

---

## AI editor integration

zm-index works with any AI coding assistant that can run shell commands. Claude Code and Cursor are supported out of the box.

## Claude Code integration

### 1. Build the index

```sh
zm-index rebuild
```

### 2. Add to your project's CLAUDE.md

Run `zm-index init` to get a ready-to-paste snippet, or add this manually:

```markdown
## Code Search
- ALWAYS use `zm-index search` FIRST for any code search task
- Run `zm-index outline <file>` BEFORE reading any file longer than 500 lines
- Only fall back to grep if zm-index returns empty results

### Commands
- `zm-index search "SymbolName"`      # find any symbol
- `zm-index outline path/to/file`     # file structure before reading
- `zm-index usages "SymbolName"`      # find references
- `zm-index callers "functionName"`   # find call sites
- `zm-index stats`                    # check index health
```

### 3. Auto-rebuild on session start (optional)

Add to `.claude/settings.json` in your project:

```json
{
  "hooks": {
    "SessionStart": [{
      "command": "zm-index stats >nul 2>&1 || zm-index rebuild"
    }]
  }
}
```

> On Linux/Mac use `>/dev/null` instead of `>nul`.

---

## Cursor integration

### 1. Build the index

```sh
zm-index rebuild
```

### 2. Generate the rules file

```sh
zm-index init --cursor
```

This writes `.cursor/rules/zm-index.mdc` with instructions telling Cursor's AI to use zm-index for all code searches. Run once per project.

---

## Supported languages

| Language | Extensions |
|----------|------------|
| TypeScript | `.ts`, `.tsx` |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` |
| Python _(planned)_ | `.py` |
| Go _(planned)_ | `.go` |
| Rust _(planned)_ | `.rs` |
| C# _(planned)_ | `.cs` |

---

## How it works

1. **Scan** — walks the project directory, respects `.gitignore`, collects source files with `mtime` and `size`
2. **Parse** — uses [tree-sitter](https://tree-sitter.github.io/) to parse each file into an AST
3. **Extract** — walks the AST and pulls out named symbols with their kind and line number
4. **Store** — writes everything to a local SQLite database with an FTS5 full-text index for fast queries
5. **Incremental** — on subsequent rebuilds, only changed files are re-parsed

---

## Privacy & security

- The index database is stored in your OS cache directory (`%LOCALAPPDATA%\zm-index\` on Windows, `~/.cache/zm-index/` on Linux/Mac) — outside your project, never committed to git
- No data is sent anywhere — all indexing and searching runs entirely on your machine
- zm-index never modifies your source files

---

## License

MIT
