'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const { fetchRemoteFile } = require('../lib/fetcher');

function getVsCodeAgentDir() {
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA || '', 'Code', 'User', 'prompts', 'agents');
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'prompts', 'agents');
    default:
      return path.join(os.homedir(), '.config', 'Code', 'User', 'prompts', 'agents');
  }
}

const GLOBAL_FILES = [
  {
    remote: 'project-template/github/agents/Rootstock Agent.agent.md',
    getTarget: () => path.join(getVsCodeAgentDir(), 'Rootstock Agent.agent.md'),
    label: 'VS Code Copilot global agent',
  },
];

async function run() {
  console.log();
  console.log(chalk.bold('  Rootstock: Global Install / Update'));
  console.log(chalk.dim('  ─────────────────────────────────────────────────'));
  console.log();

  for (const entry of GLOBAL_FILES) {
    const target = entry.getTarget();
    const dir = path.dirname(target);

    try {
      process.stdout.write(chalk.dim(`  Fetching ${entry.label}...`));
      const content = await fetchRemoteFile(entry.remote);

      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const existed = fs.existsSync(target);
      fs.writeFileSync(target, content, 'utf8');

      const label = existed ? chalk.blue('↑ Updated') : chalk.green('+ Installed');
      process.stdout.write(`\r  ${label}: ${target}\n`);
    } catch (err) {
      process.stdout.write(`\r  ${chalk.red('✗')} ${entry.label}: ${err.message}\n`);
    }
  }

  console.log();
  console.log(chalk.bold('  After install:'));
  console.log(chalk.dim('    1. Reload VS Code (or open a new chat window)'));
  console.log(chalk.dim('    2. Select "Rootstock Agent" in the chat agent picker'));
  console.log(chalk.dim('    3. For project-level skills: run altors new or altors update in your project'));
  console.log();
  console.log(chalk.bold('  To update in future:'));
  console.log(chalk.cyan('    npm update -g @altotyler/rootstock-cli'));
  console.log(chalk.cyan('    altors install'));
  console.log();
}

module.exports = { run };
