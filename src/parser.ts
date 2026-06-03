import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const Parser = require('tree-sitter');
const { typescript, tsx } = require('tree-sitter-typescript');

const tsParser = new Parser();
tsParser.setLanguage(typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(tsx);

const TSX_EXTENSIONS = new Set(['.tsx', '.jsx', '.vue', '.svelte']);

export interface ParseResult {
  tree: ReturnType<typeof tsParser.parse>;
  parser: typeof tsParser;
}

export function parse(filePath: string, source: string): ParseResult | null {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  const parser = TSX_EXTENSIONS.has(ext) ? tsxParser : tsParser;
  try {
    const tree = parser.parse(source);
    return { tree, parser };
  } catch (err) {
    console.error(`[zm-index] Failed to parse ${filePath}:`, err);
    return null;
  }
}
