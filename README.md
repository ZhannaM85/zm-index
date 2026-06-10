# zm-index

Fast local code symbol index for AI coding assistants. Built by Zhanna Myshkovskaya.

zm-index scans your codebase, extracts symbols (classes, functions, interfaces, methods), and stores them in a local SQLite database. Instead of reading whole files, AI agents like Claude Code can query the index and get precise results in milliseconds — saving tokens and time on large projects.

**All data stays local.** The index is stored in your OS cache directory and never touches your source files or leaves your machine.

---

## What is a symbol?

In zm-index, a **symbol** is any named thing you define in your code — not a letter or a special character. For example:

| What you write | Symbol name | Kind |
|----------------|-------------|------|
| `class UserService` | `UserService` | class |
| `function fetchData()` | `fetchData` | function |
| `interface ApiResponse` | `ApiResponse` | interface |
| `const MAX_RETRIES = 3` | `MAX_RETRIES` | const |
| `type UserId = string` | `UserId` | type |
| `enum Direction` | `Direction` | enum |

When you run `zm-index search UserService`, you're asking: _"where in this codebase is something called UserService defined?"_ — and zm-index tells you the exact file and line number.

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

| Command | Description | Example |
|---------|-------------|---------|
| `zm-index rebuild` | Scan the project and build the symbol index from scratch | `zm-index rebuild` |
| `zm-index rebuild --verbose` | Full rebuild with per-stage timing breakdown | `zm-index rebuild --verbose` |
| `zm-index search <symbol>` | Find any symbol by name (supports partial match) | `zm-index search UserService` |
| `zm-index outline <file>` | List all symbols defined in a file, sorted by line | `zm-index outline src/db.ts` |
| `zm-index outline --all` | List all symbols across every indexed file | `zm-index outline --all` |
| `zm-index usages <symbol>` | Find all references to a symbol | `zm-index usages ApiResponse` |
| `zm-index callers <function>` | Find all call sites of a function | `zm-index callers fetchData` |
| `zm-index stats` | Show file count, symbol count, DB size, last updated | `zm-index stats` |
| `zm-index db-path` | Print the path to the local index database | `zm-index db-path` |
| `zm-index init` | Print a CLAUDE.md snippet to enable zm-index in this project | `zm-index init` |
| `zm-index init --write` | Append the snippet directly to CLAUDE.md | `zm-index init --write` |
| `zm-index init --cursor` | Write `.cursor/rules/zm-index.mdc` for Cursor IDE | `zm-index init --cursor` |

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

Add to `.claude/settings.json` in your project to keep the index fresh automatically:

**Windows:**
```json
{
  "hooks": {
    "SessionStart": [{
      "command": "zm-index stats >nul 2>&1 || zm-index rebuild"
    }]
  }
}
```

**Linux/Mac:**
```json
{
  "hooks": {
    "SessionStart": [{
      "command": "zm-index stats >/dev/null 2>&1 || zm-index rebuild"
    }]
  }
}
```

This checks whether the index is valid (`zm-index stats`) and rebuilds only if needed. To keep `.claude/settings.json` out of version control, add it to `.git/info/exclude`:

```sh
echo ".claude/settings.json" >> .git/info/exclude
```

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
| Vue / Svelte | `.vue`, `.svelte` |
| Python | `.py` |
| Go | `.go` |
| Rust | `.rs` |
| C# | `.cs` |

---

## How it works

1. **Scan** — walks the project directory, respects `.gitignore`, collects source files with `mtime` and `size`
2. **Parse** — uses [tree-sitter](https://tree-sitter.github.io/) to parse each file into an AST (Abstract Syntax Tree — a structured representation of code where each function, class, and variable becomes a named node in a tree)
3. **Extract** — walks the AST and pulls out named symbols with their kind and line number
4. **Store** — writes everything to a local SQLite database with an FTS5 full-text index for fast queries
5. **Incremental** — on subsequent rebuilds, only changed files are re-parsed

---

## Why it's faster than grep

When Claude Code searches for a symbol without zm-index, it uses `grep` — which reads every single file in your project from top to bottom every time.

| | How it searches | Complexity |
|---|---|---|
| **grep** | Scans all characters in all files on every search | O(F × C) — proportional to the number of files × characters per file |
| **zm-index** | Looks up a pre-built index, like a book's index page | O(log S) — proportional to the log of the number of symbols |

In plain terms: if your project has 500 files with 300 lines each, grep reads **150,000 lines** on every search. zm-index does a single index lookup regardless of project size — the result comes back in milliseconds whether your project has 100 files or 10,000.

The trade-off: you pay a one-time cost upfront when you run `zm-index rebuild` to build the index (O(F × C), same as grep). Every search after that is fast.

---

## Performance

zm-index is benchmarked against the TypeScript compiler source (~500 `.ts` files, ~150k lines) using [hyperfine](https://github.com/sharkdp/hyperfine).

Run the benchmarks yourself:

```sh
bash benchmarks/run.sh
```

The script downloads the TypeScript corpus automatically on first run and produces a results table.

### Representative results (modern laptop, NVMe SSD)

| Command | Mean time | Notes |
|---------|-----------|-------|
| `zm-index rebuild` (cold) | ~2.1 s | Full parse + DB build from scratch |
| `zm-index rebuild` (warm) | ~65 ms | No file changes — just scans mtimes |
| `zm-index search Program` | ~8 ms | FTS5 index lookup |
| `grep -r 'Program' src/` | ~240 ms | Full text scan of all files |

**zm-index search is ~30× faster than grep** for symbol lookups after the index is built. The one-time rebuild cost (2 s) is recovered after just a few searches.

### Verbose timing breakdown

Pass `--verbose` to `rebuild` to see a per-stage breakdown:

```sh
zm-index rebuild --verbose
```

```
✔ 487 updated — 12,433 symbols total (2.14s)

Stage breakdown:
  File scan       12 ms  (487 files)
  Parse         1847 ms  (3.8 ms/file avg, 487 parsed)
  DB write       295 ms
```

---

## Privacy & security

- The index database is stored in your OS cache directory (`%LOCALAPPDATA%\zm-index\` on Windows, `~/.cache/zm-index/` on Linux/Mac) — outside your project, never committed to git
- No data is sent anywhere — all indexing and searching runs entirely on your machine
- zm-index never modifies your source files

---

## License

MIT
