import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const Parser = require('tree-sitter');
const { typescript, tsx } = require('tree-sitter-typescript');
const python = require('tree-sitter-python');

const tsParser = new Parser();
tsParser.setLanguage(typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(tsx);

const pyParser = new Parser();
pyParser.setLanguage(python);

const TSX_EXTENSIONS = new Set(['.tsx', '.jsx', '.vue', '.svelte']);

export interface ParseResult {
  tree: ReturnType<typeof tsParser.parse>;
  parser: typeof tsParser;
}

export function parse(filePath: string, source: string): ParseResult | null {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  let parser: typeof tsParser;
  if (ext === '.py') {
    parser = pyParser;
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
