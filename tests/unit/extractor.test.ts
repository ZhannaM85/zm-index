import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse } from '../../src/parser.ts';
import { extractSymbols } from '../../src/extractor.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixtureDir = resolve(__dirname, '../fixtures/sample-project/src');

test('extracts interface, class, and methods from user.ts', () => {
  const filePath = join(fixtureDir, 'user.ts');
  const source = readFileSync(filePath, 'utf8');
  const parsed = parse(filePath, source);
  assert.ok(parsed, 'parse returned null');
  const symbols = extractSymbols(parsed.tree.rootNode, filePath);

  const find = (name: string) => symbols.find(s => s.name === name);

  const user = find('User');
  assert.ok(user, 'User not found');
  assert.equal(user!.kind, 'interface');
  assert.equal(user!.line, 1);

  const svc = find('UserService');
  assert.ok(svc, 'UserService not found');
  assert.equal(svc!.kind, 'class');
  assert.equal(svc!.line, 7);

  assert.equal(find('getUser')?.kind, 'method');
  assert.equal(find('getUser')?.line, 10);
  assert.equal(find('addUser')?.kind, 'method');
  assert.equal(find('addUser')?.line, 14);
  assert.equal(find('deleteUser')?.kind, 'method');
  assert.equal(find('deleteUser')?.line, 18);
});

test('extracts type, enum, const, and functions from utils.ts', () => {
  const filePath = join(fixtureDir, 'utils.ts');
  const source = readFileSync(filePath, 'utf8');
  const parsed = parse(filePath, source);
  assert.ok(parsed, 'parse returned null');
  const symbols = extractSymbols(parsed.tree.rootNode, filePath);

  const byKind = (kind: string) => symbols.filter(s => s.kind === kind).map(s => s.name).sort();

  assert.deepEqual(byKind('type'), ['UserId']);
  assert.deepEqual(byKind('enum'), ['Role']);
  assert.deepEqual(byKind('const'), ['DEFAULT_ROLE']);
  assert.deepEqual(byKind('function'), ['formatName', 'isAdmin']);
});

test('arrow-function const gets kind "function", plain const gets kind "const"', () => {
  const source = `const greet = (name: string) => \`Hello \${name}\`;\nconst VERSION = '1.0.0';`;
  const filePath = 'inline.ts';
  const parsed = parse(filePath, source);
  assert.ok(parsed);
  const symbols = extractSymbols(parsed.tree.rootNode, filePath);

  const greet = symbols.find(s => s.name === 'greet');
  assert.equal(greet?.kind, 'function', 'arrow function should have kind "function"');

  const ver = symbols.find(s => s.name === 'VERSION');
  assert.equal(ver?.kind, 'const', 'plain const should have kind "const"');
});

test('re-export statement does not crash the extractor', () => {
  const source = `export { UserService } from './user.js';`;
  const filePath = 'reexport.ts';
  const parsed = parse(filePath, source);
  assert.ok(parsed);
  // re-exports produce no new symbol definitions — just verify no exception is thrown
  const symbols = extractSymbols(parsed.tree.rootNode, filePath);
  assert.ok(Array.isArray(symbols));
});

test('top-level anonymous class expression assigned to const is extracted', () => {
  const source = `const Handler = class {\n  handle() {}\n};`;
  const filePath = 'anon.ts';
  const parsed = parse(filePath, source);
  assert.ok(parsed);
  const symbols = extractSymbols(parsed.tree.rootNode, filePath);
  // The variable declarator name 'Handler' is a const (value is a class expression, not arrow/function)
  const handler = symbols.find(s => s.name === 'Handler');
  assert.ok(handler, 'Handler const not found');
  assert.equal(handler!.kind, 'const');
});
