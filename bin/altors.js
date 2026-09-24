#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const { checkForUpdate } = require('../src/lib/updater');
const pkg = require('../package.json');

const program = new Command();

program
  .name('altors')
  .description('Rootstock Salesforce DX project creator for Claude Code')
  .version(pkg.version, '-v, --version', 'Show installed version');

program
  .command('new')
  .description('Create a new Salesforce DX project set up for Claude Code and the Rootstock plugins')
  .action(async () => {
    const { run } = require('../src/commands/new');
    await run();
  });

program
  .command('update')
  .description('Move the current project to the Rootstock Claude Code plugins (removes old skill, Cursor, and Copilot files)')
  .action(async () => {
    const { run } = require('../src/commands/update');
    await run();
  });

(async () => {
  // Non-blocking version check — runs in background, prints after command
  const updatePromise = checkForUpdate(pkg.version).catch(() => null);

  await program.parseAsync(process.argv);

  // Print update notice after command output if one is available
  const update = await updatePromise;
  if (update) {
    console.log();
    console.log(chalk.yellow('┌─────────────────────────────────────────────────────┐'));
    console.log(chalk.yellow('│') + chalk.white(`  Update available: ${chalk.dim(update.current)} → ${chalk.green(update.latest)}`.padEnd(53)) + chalk.yellow('│'));
    console.log(chalk.yellow('│') + chalk.white(`  Run: ${chalk.cyan('npm install -g @altotyler/alto-rootstock-cli@latest --prefer-online')}`.padEnd(53)) + chalk.yellow('│'));
    console.log(chalk.yellow('└─────────────────────────────────────────────────────┘'));
  }
})();
