import { Symbol } from './extractor.js';

type SyntaxNode = {
  type: string;
  text: string;
  startPosition: { row: number };
  namedChildren: SyntaxNode[];
  childForFieldName: (name: string) => SyntaxNode | null;
};

export function extractRustSymbols(rootNode: SyntaxNode, filePath: string): Symbol[] {
  const symbols: Symbol[] = [];
  for (const node of rootNode.namedChildren) {
    extractRustNode(node, filePath, symbols);
  }
  return symbols;
}

function extractRustNode(node: SyntaxNode, filePath: string, symbols: Symbol[]): void {
  switch (node.type) {
    case 'struct_item': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'struct', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'enum_item': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'enum', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'trait_item': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'interface', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'function_item': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'function', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'impl_item': {
      // extract methods inside impl blocks
      const body = node.childForFieldName('body');
      if (!body) break;
      for (const child of body.namedChildren) {
        if (child.type === 'function_item') {
          const name = child.childForFieldName('name')?.text;
          if (name) symbols.push({ name, kind: 'method', file: filePath, line: child.startPosition.row + 1 });
        }
      }
      break;
    }
    case 'type_item': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'type', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
    case 'const_item': {
      const name = node.childForFieldName('name')?.text;
      if (name) symbols.push({ name, kind: 'const', file: filePath, line: node.startPosition.row + 1 });
      break;
    }
  }
}
