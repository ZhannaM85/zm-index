#!/usr/bin/env node
import { program } from 'commander';
import { createRequire } from 'module';
import { ensureGitignore } from './gitignore.js';
import { rebuild } from './rebuild.js';
import { search } from './search.js';
import { outline } from './outline.js';
import { usages } from './usages.js';
import { callers } from './callers.js';
import { stats } from './stats.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

program
  .name('zm-index')
  .description('Fast local code symbol index for AI coding assistants')
  .version(version);

program
  .command('rebuild')
  .description('Scan the project and build the symbol index from scratch')
  .action(() => {
    ensureGitignore(process.cwd());
    rebuild(process.cwd());
  });

program
  .command('search <symbol>')
  .description('Find any symbol by name')
  .action((symbol) => { search(process.cwd(), symbol); });

program
  .command('outline <file>')
  .description('List all symbols defined in a file')
  .action((file) => { outline(process.cwd(), file); });

program
  .command('usages <symbol>')
  .description('Find all references to a symbol')
  .action((symbol) => { usages(process.cwd(), symbol); });

program
  .command('callers <function>')
  .description('Find all call sites of a function')
  .action((fn) => { callers(process.cwd(), fn); });

program
  .command('stats')
  .description('Show index statistics for the current project')
  .action(() => { stats(process.cwd()); });

program
  .command('db-path')
  .description('Print the path to the index database')
  .action(() => { console.log('db-path: not yet implemented'); });

program
  .command('init')
  .description('Print a CLAUDE.md snippet to enable zm-index in this project')
  .action(() => { console.log('init: not yet implemented'); });

program.parse();
