import type { Symbol } from './extractor.js';

type SyntaxNode = {
  type: string;
  text: string;
  startPosition: { row: number };
  namedChildren: SyntaxNode[];
  childForFieldName: (name: string) => SyntaxNode | null;
};

export function extractPythonSymbols(rootNode: SyntaxNode, filePath: string): Symbol[] {
  const symbols: Symbol[] = [];
  visitNodes(rootNode.namedChildren, filePath, symbols, false);
  return symbols;
}

function visitNodes(nodes: SyntaxNode[], filePath: string, symbols: Symbol[], insideClass: boolean): void {
  for (const node of nodes) {
    visitNode(node, filePath, symbols, insideClass);
  }
}

function visitNode(node: SyntaxNode, filePath: string, symbols: Symbol[], insideClass: boolean): void {
  switch (node.type) {
    case 'class_definition': {
      const name = node.childForFieldName('name')?.text;
      if (name) {
        symbols.push({ name, kind: 'class', file: filePath, line: node.startPosition.row + 1 });
        const body = node.childForFieldName('body');
        if (body) visitNodes(body.namedChildren, filePath, symbols, true);
      }
      break;
    }
    case 'function_definition': {
      const name = node.childForFieldName('name')?.text;
      if (name) {
        symbols.push({ name, kind: insideClass ? 'method' : 'function', file: filePath, line: node.startPosition.row + 1 });
      }
      break;
    }
    case 'decorated_definition': {
      visitNodes(node.namedChildren, filePath, symbols, insideClass);
      break;
    }
  }
}
