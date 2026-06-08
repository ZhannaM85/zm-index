import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = resolve(__dirname, '../fixtures/sample-project');
const cli = resolve(__dirname, '../../src/cli.ts');

function run(...args: string[]) {
  return spawnSync('node', ['--import', 'tsx/esm', cli, ...args], {
    cwd: fixture,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

// rebuild must be first — all subsequent commands depend on a populated index
test('zm-index rebuild reports file count and symbol count', () => {
  const r = run('rebuild');
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /✔/);
  assert.match(r.stdout, /\d+ symbol/);
});

test('zm-index search UserService returns correct file and line', () => {
  const r = run('search', 'UserService');
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /UserService/);
  assert.match(r.stdout, /user\.ts:7/);
});

test('zm-index outline src/user.ts returns symbols sorted by line', () => {
  const r = run('outline', 'src/user.ts');
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /UserService/);
  assert.match(r.stdout, /getUser/);

  const lines = r.stdout.trim().split('\n');
  const lineNums = lines.map(l => parseInt(l.trim().split(/\s+/)[0], 10)).filter(n => !isNaN(n));
  assert.ok(lineNums.length > 0, 'no line numbers found in outline output');
  for (let i = 1; i < lineNums.length; i++) {
    assert.ok(lineNums[i] >= lineNums[i - 1], `symbols out of order: ${lineNums[i - 1]} > ${lineNums[i]}`);
  }
});

test('zm-index usages UserService returns reference locations', () => {
  const r = run('usages', 'UserService');
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /user\.ts/);
  assert.match(r.stdout, /usage/);
});

test('zm-index stats reports non-zero file and symbol counts', () => {
  const r = run('stats');
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /Files:\s+[1-9]/);
  assert.match(r.stdout, /Symbols:\s+[1-9]/);
});

test('zm-index db-path prints a valid path ending in .db', () => {
  const r = run('db-path');
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout.trim(), /\.db$/);
});
