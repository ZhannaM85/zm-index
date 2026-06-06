import type { Symbol } from './extractor.js';

type SyntaxNode = {
  type: string;
  text: string;
  startPosition: { row: number };
  namedChildren: SyntaxNode[];
  childForFieldName: (name: string) => SyntaxNode | null;
};

export function extractCSharpSymbols(rootNode: SyntaxNode, filePath: string): Symbol[] {
  const symbols: Symbol[] = [];
  visitNodes(rootNode.namedChildren, filePath, symbols);
  return symbols;
}

function visitNodes(nodes: SyntaxNode[], filePath: string, symbols: Symbol[]): void {
  for (const node of nodes) {
    visitNode(node, filePath, symbols);
  }
}

function visitNode(node: SyntaxNode, filePath: string, symbols: Symbol[]): void {
  switch (node.type) {
    case 'class_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) {
        symbols.push({ name, kind: 'class', file: filePath, line: node.startPosition.row + 1 });
        visitNodes(node.namedChildren, filePath, symbols);
      }
      break;
    }
    case 'interface_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'interface', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'method_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'method', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'enum_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'enum', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'record_declaration': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'record', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'namespace_declaration':
    case 'file_scoped_namespace_declaration': {
      visitNodes(node.namedChildren, filePath, symbols);
      break;
    }
  }
}
