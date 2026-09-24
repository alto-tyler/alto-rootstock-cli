'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { migrateProject, removeGlobalCopilotAgent, printPluginHelp } = require('../lib/scaffold');

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
  console.log(chalk.bold('  Rootstock: Move Project to the Claude Code Plugin'));
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

  const { removed } = migrateProject(projectRoot);

  const globalAgent = removeGlobalCopilotAgent();
  if (globalAgent) console.log(`  ${chalk.red('−')} ${globalAgent}`);

  console.log();
  if (removed.length > 0) {
    console.log(chalk.green(`  ✓ Removed ${removed.length} old skill/Cursor/Copilot file(s).`) + chalk.dim(' Review and commit the changes.'));
  } else {
    console.log(chalk.green('  ✓ Project is up to date.'));
  }
  console.log();
  printPluginHelp();
  console.log();
}

module.exports = { run };
