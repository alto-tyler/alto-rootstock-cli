'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const prompts = require('prompts');
const { injectScaffolding } = require('../lib/scaffold');


function banner() {
  console.log();
  console.log(chalk.bold.blue('  ┌─────────────────────────────────────────────┐'));
  console.log(chalk.bold.blue('  │') + chalk.bold.white('  alto-rootstock-cli                         ') + chalk.bold.blue('│'));
  console.log(chalk.bold.blue('  │') + chalk.dim('  Rootstock Salesforce Project Creator       ') + chalk.bold.blue('│'));
  console.log(chalk.bold.blue('  └─────────────────────────────────────────────┘'));
  console.log();
}

function checkSfCli() {
  const result = spawnSync('sf', ['--version'], { encoding: 'utf8', shell: true });
  if (result.status !== 0 || result.error) {
    console.error(chalk.red('  ✗ Salesforce CLI (sf) not found.'));
    console.error(chalk.dim('    Install it from: https://developer.salesforce.com/tools/salesforcecli'));
    process.exit(1);
  }
  const version = (result.stdout || '').split('\n')[0].trim();
  console.log(`  ${chalk.green('✓')} Salesforce CLI detected ${chalk.dim(`(${version})`)}`);
}


async function promptProjectDetails() {
  console.log();
  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name',
        validate: v => v.trim().length > 0 ? true : 'Project name is required',
      },
      {
        type: 'text',
        name: 'outputDir',
        message: 'Output directory',
        initial: '.',
        format: v => v.trim() || '.',
      },
    ],
    {
      onCancel: () => {
        console.log(chalk.dim('\n  Cancelled.'));
        process.exit(0);
      },
    }
  );
  return response;
}

function runSfProjectGenerate(projectName, outputDir) {
  console.log();
  console.log(chalk.dim(`  Running: sf project generate --manifest --name ${projectName} --output-dir ${outputDir}`));
  console.log(chalk.dim('  ─────────────────────────────────────────────────'));
  console.log();

  // stdio: inherit lets sf prompt the user for remaining questions
  // (default package dir, API version, etc.) natively
  const result = spawnSync(
    'sf',
    ['project', 'generate', '--manifest', '--name', projectName, '--output-dir', outputDir],
    { stdio: 'inherit', shell: true }
  );

  console.log();

  if (result.status !== 0) {
    console.error(chalk.red('  ✗ sf project generate failed.'));
    process.exit(1);
  }
}

async function run() {
  banner();
  checkSfCli();

  const { projectName, outputDir } = await promptProjectDetails();

  runSfProjectGenerate(projectName, outputDir);

  // sf creates the project at <outputDir>/<projectName>
  const projectRoot = path.resolve(outputDir, projectName);

  if (!fs.existsSync(projectRoot)) {
    console.error(chalk.red(`  ✗ Expected project directory not found: ${projectRoot}`));
    console.error(chalk.dim('    sf may have used a different path. Run altors update from inside the project directory.'));
    process.exit(1);
  }

  console.log(`  ${chalk.green('✓')} Salesforce DX project created`);
  console.log();
  console.log(chalk.bold('  Injecting Rootstock agent scaffolding...'));
  console.log();

  const results = await injectScaffolding(projectRoot);

  console.log();

  if (results.failed.length > 0) {
    console.log(chalk.yellow(`  ⚠  ${results.failed.length} file(s) failed to fetch. Run ${chalk.cyan('altors update')} inside the project to retry.`));
    console.log();
  }

  console.log(chalk.bold.blue('  ┌─────────────────────────────────────────────┐'));
  console.log(chalk.bold.blue('  │') + chalk.bold.green(`  ✓ Project ready: ${path.relative(process.cwd(), projectRoot)}`.padEnd(46)) + chalk.bold.blue('│'));
  console.log(chalk.bold.blue('  └─────────────────────────────────────────────┘'));
  console.log();
  console.log(chalk.bold('  Next steps:'));
  console.log(chalk.dim(`    cd ${path.relative(process.cwd(), projectRoot)}`));
  console.log(chalk.dim('    sf org login web --alias myorg'));
  console.log(chalk.dim('    code .                              # open in VS Code'));
  console.log(chalk.dim('    # Reload VS Code to activate the Salesforce DX MCP server'));
  console.log();
}

module.exports = { run };
