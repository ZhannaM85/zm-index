# Issues Priority List

Issues grouped by implementation tier. Work top-to-bottom within each tier; dependencies are noted where order matters within a tier.

---

## Tier 1 — Foundation
_Core infrastructure that everything else depends on. Do in order._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#1](https://github.com/ZhannaM85/zm-index/issues/1)~~ | ~~feat: project scaffold — ESM Node.js CLI with commander~~ | ~~Entry point, `--help`, basic command structure~~ |
| ~~[#2](https://github.com/ZhannaM85/zm-index/issues/2)~~ | ~~feat: SQLite database setup with better-sqlite3~~ | ~~Schema: `files` + `symbols` tables, FTS5 index, `openDb(projectRoot)` helper~~ |
| ~~[#3](https://github.com/ZhannaM85/zm-index/issues/3)~~ | ~~feat: file scanner — walk project directory and collect source files~~ | ~~Filter by extension, respect `.gitignore`, return `{ path, mtime, size }`~~ |
| ~~[#23](https://github.com/ZhannaM85/zm-index/issues/23)~~ | ~~feat: auto-add zm-index artifacts to .gitignore in the target project~~ | ~~Prevent index DB files from being accidentally committed in work repos~~ |
| ~~[#24](https://github.com/ZhannaM85/zm-index/issues/24)~~ | ~~feat: lock down npm package contents to prevent bundling work project code~~ | ~~Use `"files": ["src/"]` + `.npmignore` to ensure only tool source is published~~ |

---

## Tier 2 — Parsing
_Parse source files into symbols. Depends on Tier 1._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#4](https://github.com/ZhannaM85/zm-index/issues/4)~~ | ~~feat: tree-sitter integration for TypeScript and JavaScript~~ | ~~Install `tree-sitter`, `tree-sitter-typescript`, `tree-sitter-javascript`; expose `parse(filePath, source)`~~ |
| ~~[#5](https://github.com/ZhannaM85/zm-index/issues/5)~~ | ~~feat: symbol extraction — functions, classes, interfaces, types, methods~~ | ~~Walk AST, extract `{ name, kind, file, line }` for all named symbols~~ |

---

## Tier 3 — Core CLI Commands
_The commands users and AI agents will run daily. Depends on Tier 2._

| # | Issue | Notes |
|---|-------|-------|
| ~~[#6](https://github.com/ZhannaM85/zm-index/issues/6)~~ | ~~feat: `zm-index rebuild` — full index build command~~ | ~~Scan → parse → store; print summary (files, symbols, time)~~ |
| ~~[#7](https://github.com/ZhannaM85/zm-index/issues/7)~~ | ~~feat: incremental index updates based on file mtime~~ | ~~Skip unchanged files; remove deleted files; speeds up repeated runs~~ |
| ~~[#8](https://github.com/ZhannaM85/zm-index/issues/8)~~ | ~~feat: `zm-index search <symbol>` — find any symbol by name~~ | ~~FTS5 query, partial/prefix match, show kind + file + line~~ |
| ~~[#9](https://github.com/ZhannaM85/zm-index/issues/9)~~ | ~~feat: `zm-index outline <file>` — list all symbols in a file~~ | ~~Returns all symbols defined in the given file, sorted by line number~~ |
| ~~[#10](https://github.com/ZhannaM85/zm-index/issues/10)~~ | ~~feat: `zm-index usages <symbol>` — find all references to a symbol~~ | ~~Text search across indexed files for the symbol name~~ |
| ~~[#11](https://github.com/ZhannaM85/zm-index/issues/11)~~ | ~~feat: `zm-index callers <function>` — find call sites of a function~~ | ~~Find places where a function is called, not just defined~~ |
| ~~[#12](https://github.com/ZhannaM85/zm-index/issues/12)~~ | ~~feat: `zm-index stats` — show index statistics~~ | ~~File count, symbol count, DB size, last updated time~~ |
| [#13](https://github.com/ZhannaM85/zm-index/issues/13) | feat: `zm-index db-path` — print the index database location | Lets users inspect or delete the DB manually |

---

## Tier 4 — AI Integration
_Make zm-index easy to adopt in Claude Code projects._

| # | Issue | Notes |
|---|-------|-------|
| [#14](https://github.com/ZhannaM85/zm-index/issues/14) | feat: `zm-index init` — generate a CLAUDE.md snippet for the project | Prints ready-to-paste rules telling Claude to use zm-index for code search |
| [#25](https://github.com/ZhannaM85/zm-index/issues/25) | feat: Cursor IDE integration — generate `.cursor/rules` snippet | `--cursor` flag writes `.cursor/rules/zm-index.mdc`; mirrors Claude Code integration |
| [#15](https://github.com/ZhannaM85/zm-index/issues/15) | docs: SessionStart hook for auto-rebuild in `.claude/settings.json` | Guide for setting up `zm-index stats || zm-index rebuild` on session start |

---

## Tier 5 — Extended Language Support
_Broaden parser coverage beyond TypeScript/JavaScript._

| # | Issue | Notes |
|---|-------|-------|
| [#16](https://github.com/ZhannaM85/zm-index/issues/16) | feat: Python support via tree-sitter-python | Extract classes, functions, methods from `.py` files |
| [#17](https://github.com/ZhannaM85/zm-index/issues/17) | feat: Go support via tree-sitter-go | Extract structs, interfaces, functions from `.go` files |
| [#18](https://github.com/ZhannaM85/zm-index/issues/18) | feat: Rust support via tree-sitter-rust | Extract structs, enums, functions, traits from `.rs` files |
| [#19](https://github.com/ZhannaM85/zm-index/issues/19) | feat: C# support via tree-sitter-c-sharp | Extract classes, methods, interfaces from `.cs` files |

---

## Tier 6 — Testing & Benchmarks
_Verify correctness and measure performance before publishing._

| # | Issue | Notes |
|---|-------|-------|
| [#26](https://github.com/ZhannaM85/zm-index/issues/26) | feat: unit and integration test suite | Fixture-based tests for symbol extraction and all CLI commands; uses `node --test` |
| [#27](https://github.com/ZhannaM85/zm-index/issues/27) | feat: performance benchmarks for rebuild and search | hyperfine macro benchmarks + per-stage timing; compare search speed against grep |

---

## Tier 7 — Distribution
_Packaging and publishing. Do last — the tool should be stable and tested first._

| # | Issue | Notes |
|---|-------|-------|
| [#20](https://github.com/ZhannaM85/zm-index/issues/20) | docs: write README with install, usage, and CLAUDE.md integration guide | Cover `npm install -g zm-index`, all commands, and AI agent setup |
| [#21](https://github.com/ZhannaM85/zm-index/issues/21) | feat: GitHub Actions CI workflow | Run tests on push and PR |
| [#22](https://github.com/ZhannaM85/zm-index/issues/22) | feat: prepare and publish package to npm | Pre-publish checklist, versioning, first release |
