'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { updateScaffolding } = require('../lib/scaffold');

function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'sfdx-project.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

async function run() {
  console.log();
  console.log(chalk.bold('  Rootstock: Update Skills'));
  console.log(chalk.dim('  ─────────────────────────────────────────────────'));
  console.log();

  const projectRoot = findProjectRoot(process.cwd());

  if (!projectRoot) {
    console.error(chalk.red('  ✗ No Salesforce DX project found (sfdx-project.json missing).'));
    console.error(chalk.dim('    Run this command from inside a Salesforce DX project directory.'));
    process.exit(1);
  }

  console.log(`  ${chalk.dim('Project root:')} ${projectRoot}`);
  console.log();

  const results = await updateScaffolding(projectRoot);

  const total = results.updated.length + results.added.length;
  console.log();

  if (results.failed.length > 0) {
    console.log(chalk.yellow(`  ⚠  ${results.failed.length} file(s) could not be fetched.`));
    console.log(chalk.dim('     Check your GITHUB_TOKEN or network connection.'));
  }

  if (total === 0 && results.failed.length === 0) {
    console.log(chalk.green('  ✓ All skill files are already up to date.'));
  } else {
    console.log(chalk.green(`  ✓ Done.`) + chalk.dim(` ${results.updated.length} updated, ${results.added.length} added, ${results.failed.length} failed.`));
  }

  console.log();
}

module.exports = { run };
