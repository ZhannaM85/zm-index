import { extractPythonSymbols } from './extractor-python.js';

export interface Symbol {
  name: string;
  kind: 'class' | 'function' | 'method' | 'interface' | 'type' | 'enum' | 'const';
  file: string;
  line: number;
}

type SyntaxNode = {
  type: string;
  text: string;
  startPosition: { row: number };
  namedChildren: SyntaxNode[];
  childForFieldName: (name: string) => SyntaxNode | null;
};

export function extractSymbols(rootNode: SyntaxNode, filePath: string): Symbol[] {
  if (filePath.endsWith('.py')) return extractPythonSymbols(rootNode, filePath);
  const symbols: Symbol[] = [];
  extractFromNodes(rootNode.namedChildren, filePath, symbols);
  return symbols;
}

function extractFromNodes(nodes: SyntaxNode[], filePath: string, symbols: Symbol[]): void {
  for (const node of nodes) {
    extractFromNode(node, filePath, symbols);
  }
}

function extractFromNode(node: SyntaxNode, filePath: string, symbols: Symbol[]): void {
  switch (node.type) {
    case 'class_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) {
        symbols.push({ name, kind: 'class', file: filePath, line: node.startPosition.row + 1 });
        extractMethods(node, filePath, symbols);
      }
      break;
    }
    case 'function_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'function', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'interface_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'interface', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'type_alias_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'type', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'enum_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'enum', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'lexical_declaration': {
      extractFromLexicalDeclaration(node, filePath, symbols);
      break;
    }
    case 'export_statement': {
      // unwrap and process the exported declaration
      extractFromNodes(node.namedChildren, filePath, symbols);
      break;
    }
  }
}

function extractFromLexicalDeclaration(node: SyntaxNode, filePath: string, symbols: Symbol[]): void {
  for (const child of node.namedChildren) {
    if (child.type !== 'variable_declarator') continue;
    const name = child.childForFieldName('name')?.text;
    if (!name) continue;
    const value = child.childForFieldName('value');
    const isFunction = value?.type === 'arrow_function' || value?.type === 'function';
    symbols.push({
      name,
      kind: isFunction ? 'function' : 'const',
      file: filePath,
      line: child.startPosition.row + 1,
    });
  }
}

function extractMethods(classNode: SyntaxNode, filePath: string, symbols: Symbol[]): void {
  const body = classNode.childForFieldName('body');
  if (!body) return;
  for (const child of body.namedChildren) {
    if (child.type !== 'method_definition') continue;
    const name = child.childForFieldName('name')?.text;
    if (name) symbols.push({ name, kind: 'method', file: filePath, line: child.startPosition.row + 1 });
  }
}
