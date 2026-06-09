#!/usr/bin/env bash
# Benchmark zm-index rebuild and search against the TypeScript compiler source.
#
# Requirements:
#   hyperfine  — https://github.com/sharkdp/hyperfine
#                brew install hyperfine  |  cargo install hyperfine  |  apt install hyperfine
#   zm-index   — npm install -g zm-index  (or run: npm run build first, uses local dist/)
#   curl + tar — standard on Linux/macOS
#
# Usage:
#   bash benchmarks/run.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
CORPUS_DIR="$SCRIPT_DIR/corpus/typescript"
TS_VERSION="5.4.5"
RESULTS_MD="$SCRIPT_DIR/results.md"

# ── Dependency checks ─────────────────────────────────────────────────────────
if ! command -v hyperfine &>/dev/null; then
  echo "Error: hyperfine is not installed."
  echo "  brew install hyperfine      (macOS)"
  echo "  cargo install hyperfine     (any)"
  echo "  apt install hyperfine       (Debian/Ubuntu)"
  echo "  See: https://github.com/sharkdp/hyperfine"
  exit 1
fi

# Prefer globally installed zm-index; fall back to local build
if command -v zm-index &>/dev/null; then
  ZM_BIN="zm-index"
else
  if [ ! -f "$ROOT_DIR/dist/cli.js" ]; then
    echo "zm-index not found globally and no dist/cli.js present. Building..."
    (cd "$ROOT_DIR" && npm run build)
  fi
  ZM_BIN="node $ROOT_DIR/dist/cli.js"
fi

# ── Download test corpus ──────────────────────────────────────────────────────
if [ ! -d "$CORPUS_DIR/src" ]; then
  echo "Downloading TypeScript $TS_VERSION source (~60 MB compressed)..."
  mkdir -p "$CORPUS_DIR"
  curl -fsSL \
    "https://github.com/microsoft/TypeScript/archive/refs/tags/v${TS_VERSION}.tar.gz" \
    | tar -xz --strip-components=1 -C "$CORPUS_DIR"
  echo "Corpus ready at $CORPUS_DIR"
fi

cd "$CORPUS_DIR"

TS_COUNT=$(find src -name '*.ts' | wc -l | tr -d ' ')
LINE_COUNT=$(find src -name '*.ts' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo ""
echo "Corpus: TypeScript $TS_VERSION — $TS_COUNT .ts files, ~$LINE_COUNT total lines"
echo ""

DB_PATH=$($ZM_BIN db-path)

# ── Benchmarks ────────────────────────────────────────────────────────────────
echo "=== 1/3  Cold rebuild (full index build, DB deleted before each run) ==="
hyperfine \
  --runs 3 \
  --prepare "rm -f '$DB_PATH'" \
  "$ZM_BIN rebuild"

echo ""
echo "=== 2/3  Warm rebuild (incremental update, no file changes) ==="
# Ensure index exists for warm baseline
$ZM_BIN rebuild >/dev/null 2>&1
hyperfine \
  --runs 5 \
  "$ZM_BIN rebuild"

echo ""
echo "=== 3/3  Symbol search vs grep ==="
hyperfine \
  --runs 10 \
  --warmup 3 \
  "$ZM_BIN search Program" \
  "grep -r 'Program' src/"

# ── Export combined results ───────────────────────────────────────────────────
echo ""
echo "Exporting results to $RESULTS_MD ..."

{
  echo "# zm-index benchmark results"
  echo ""
  echo "Corpus: TypeScript $TS_VERSION — $TS_COUNT .ts files, ~$LINE_COUNT lines"
  echo ""
} > "$RESULTS_MD"

hyperfine \
  --runs 3 \
  --prepare "rm -f '$DB_PATH'" \
  --export-markdown /dev/stdout \
  "$ZM_BIN rebuild" \
  2>/dev/null >> "$RESULTS_MD" || true

$ZM_BIN rebuild >/dev/null 2>&1

{
  echo ""
  echo "**Warm rebuild (incremental, no changes):**"
  echo ""
} >> "$RESULTS_MD"

hyperfine \
  --runs 5 \
  --export-markdown /dev/stdout \
  "$ZM_BIN rebuild" \
  2>/dev/null >> "$RESULTS_MD" || true

{
  echo ""
  echo "**Search vs grep:**"
  echo ""
} >> "$RESULTS_MD"

hyperfine \
  --runs 10 \
  --warmup 3 \
  --export-markdown /dev/stdout \
  "$ZM_BIN search Program" \
  "grep -r 'Program' src/" \
  2>/dev/null >> "$RESULTS_MD" || true

echo "Results saved to $RESULTS_MD"
