import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const Parser = require('tree-sitter');
const { typescript, tsx } = require('tree-sitter-typescript');
const Go = require('tree-sitter-go');
const python = require('tree-sitter-python');
const Rust = require('tree-sitter-rust');

const tsParser = new Parser();
tsParser.setLanguage(typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(tsx);

const goParser = new Parser();
goParser.setLanguage(Go);

const pyParser = new Parser();
pyParser.setLanguage(python);

const rustParser = new Parser();
rustParser.setLanguage(Rust);

const TSX_EXTENSIONS = new Set(['.tsx', '.jsx', '.vue', '.svelte']);

export interface ParseResult {
  tree: ReturnType<typeof tsParser.parse>;
  parser: typeof tsParser;
}

export function parse(filePath: string, source: string): ParseResult | null {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  let parser: typeof tsParser;
  if (ext === '.go') {
    parser = goParser;
  } else if (ext === '.py') {
    parser = pyParser;
  } else if (ext === '.rs') {
    parser = rustParser;
  } else if (TSX_EXTENSIONS.has(ext)) {
    parser = tsxParser;
  } else {
    parser = tsParser;
  }
  try {
    const tree = parser.parse(source);
    return { tree, parser };
  } catch (err) {
    console.error(`[zm-index] Failed to parse ${filePath}:`, err);
    return null;
  }
}
