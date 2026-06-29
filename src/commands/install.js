'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const prompts = require('prompts');
const { fetchRemoteFile } = require('../lib/fetcher');
const { getToken, saveToken } = require('../lib/config');

// VS Code Copilot global agent directory by platform
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

// Global Claude Code commands directory
function getClaudeCommandsDir() {
  return path.join(os.homedir(), '.claude', 'commands');
}

const GLOBAL_FILES = [
  {
    remote: 'project-template/github/agents/Rootstock Agent.agent.md',
    getTarget: () => path.join(getVsCodeAgentDir(), 'Rootstock Agent.agent.md'),
    label: 'VS Code Copilot global agent',
  },
];

async function promptForToken() {
  console.log();
  console.log(chalk.yellow('  No GitHub token found.'));
  console.log(chalk.dim('  A token with read:packages scope is required to access the private distribution repo.'));
  console.log();

  const { token } = await prompts(
    {
      type: 'password',
      name: 'token',
      message: 'GitHub Personal Access Token (read:packages)',
    },
    { onCancel: () => process.exit(0) }
  );

  if (!token) return null;

  const { save } = await prompts(
    {
      type: 'confirm',
      name: 'save',
      message: 'Save token to ~/.alto-rootstock/config.json for future use?',
      initial: true,
    },
    { onCancel: () => {} }
  );

  if (save) {
    saveToken(token);
    console.log(`  ${chalk.green('✓')} Token saved to ~/.alto-rootstock/config.json`);
  }

  // Also write to ~/.npmrc so npm update works without re-entering the token
  const npmrcPath = path.join(os.homedir(), '.npmrc');
  const npmrcLine = `//npm.pkg.github.com/:_authToken=${token}`;
  const npmrcScope = '@alto-tyler:registry=https://npm.pkg.github.com';

  let npmrcContent = '';
  if (fs.existsSync(npmrcPath)) {
    npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
  }

  let updated = false;
  if (!npmrcContent.includes('//npm.pkg.github.com/:_authToken=')) {
    npmrcContent += `\n${npmrcLine}\n`;
    updated = true;
  } else {
    // Replace existing token line
    npmrcContent = npmrcContent.replace(/\/\/npm\.pkg\.github\.com\/:_authToken=.*/g, npmrcLine);
    updated = true;
  }
  if (!npmrcContent.includes('@alto-tyler:registry=')) {
    npmrcContent += `${npmrcScope}\n`;
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(npmrcPath, npmrcContent.trimStart(), 'utf8');
    console.log(`  ${chalk.green('✓')} ~/.npmrc updated — ${chalk.cyan('npm update -g @alto-tyler/alto-rootstock-cli')} will work without re-entering a token`);
  }

  process.env.GITHUB_TOKEN = token;
  return token;
}

async function run() {
  console.log();
  console.log(chalk.bold('  Rootstock: Global Install / Update'));
  console.log(chalk.dim('  ─────────────────────────────────────────────────'));
  console.log();

  let token = getToken();
  if (!token) {
    token = await promptForToken();
    if (!token) {
      console.error(chalk.red('  ✗ No token provided. Cannot access private distribution repo.'));
      process.exit(1);
    }
  } else {
    console.log(`  ${chalk.green('✓')} GitHub token found`);
  }

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
  console.log(chalk.cyan('    npm update -g @alto-tyler/alto-rootstock-cli'));
  console.log(chalk.cyan('    altors install'));
  console.log();
}

module.exports = { run };
