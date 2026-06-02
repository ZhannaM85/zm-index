#!/usr/bin/env node
import { program } from 'commander';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

program
  .name('zm-index')
  .description('Fast local code symbol index for AI coding assistants')
  .version(version);

program
  .command('rebuild')
  .description('Scan the project and build the symbol index from scratch')
  .action(() => { console.log('rebuild: not yet implemented'); });

program
  .command('search <symbol>')
  .description('Find any symbol by name')
  .action(() => { console.log('search: not yet implemented'); });

program
  .command('outline <file>')
  .description('List all symbols defined in a file')
  .action(() => { console.log('outline: not yet implemented'); });

program
  .command('usages <symbol>')
  .description('Find all references to a symbol')
  .action(() => { console.log('usages: not yet implemented'); });

program
  .command('callers <function>')
  .description('Find all call sites of a function')
  .action(() => { console.log('callers: not yet implemented'); });

program
  .command('stats')
  .description('Show index statistics for the current project')
  .action(() => { console.log('stats: not yet implemented'); });

program
  .command('db-path')
  .description('Print the path to the index database')
  .action(() => { console.log('db-path: not yet implemented'); });

program
  .command('init')
  .description('Print a CLAUDE.md snippet to enable zm-index in this project')
  .action(() => { console.log('init: not yet implemented'); });

program.parse();
