'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { fetchRemoteFile } = require('./fetcher');

// Maps remote template paths → local project paths
const SCAFFOLD_MANIFEST = [
  { remote: 'project-template/claude/CLAUDE.md',                              local: '.claude/CLAUDE.md' },
  { remote: 'project-template/claude/skills/rootstock-core.md',               local: '.claude/skills/rootstock-core.md' },
  { remote: 'project-template/claude/skills/rootstock-soapi.md',              local: '.claude/skills/rootstock-soapi.md' },
  { remote: 'project-template/claude/skills/rootstock-sydata.md',             local: '.claude/skills/rootstock-sydata.md' },
  { remote: 'project-template/claude/skills/rootstock-sydatat.md',            local: '.claude/skills/rootstock-sydatat.md' },
  { remote: 'project-template/claude/skills/rootstock-poloader.md',           local: '.claude/skills/rootstock-poloader.md' },
  { remote: 'project-template/claude/skills/rootstock-manufacturing.md',      local: '.claude/skills/rootstock-manufacturing.md' },
  { remote: 'project-template/claude/skills/rootstock-inventory.md',          local: '.claude/skills/rootstock-inventory.md' },
  { remote: 'project-template/claude/skills/rootstock-testing.md',            local: '.claude/skills/rootstock-testing.md' },
  { remote: 'project-template/claude/skills/rootstock-debug.md',              local: '.claude/skills/rootstock-debug.md' },
  { remote: 'project-template/claude/skills/rootstock-session.md',            local: '.claude/skills/rootstock-session.md' },
  { remote: 'project-template/cursor/rules/rootstock.mdc',                    local: '.cursor/rules/rootstock.mdc' },
  { remote: 'project-template/github/agents/Rootstock Agent.agent.md',        local: '.github/agents/Rootstock Agent.agent.md' },
  { remote: 'project-template/github/copilot-instructions.md',                local: '.github/copilot-instructions.md' },
  { remote: 'project-template/vscode/mcp.json',                               local: '.vscode/mcp.json' },
  { remote: 'project-template/vscode/tasks.json',                             local: '.vscode/tasks.json' },
];

function writeFile(projectRoot, relPath, content) {
  const full = path.join(projectRoot, relPath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

async function injectScaffolding(projectRoot) {
  const results = { ok: [], failed: [] };

  for (const entry of SCAFFOLD_MANIFEST) {
    try {
      process.stdout.write(chalk.dim(`  Fetching ${entry.local}...`));
      const content = await fetchRemoteFile(entry.remote);
      writeFile(projectRoot, entry.local, content);
      process.stdout.write(`\r  ${chalk.green('✓')} ${entry.local}\n`);
      results.ok.push(entry.local);
    } catch (err) {
      process.stdout.write(`\r  ${chalk.red('✗')} ${entry.local} ${chalk.dim(`(${err.message})`)}\n`);
      results.failed.push(entry.local);
    }
  }

  return results;
}

async function updateScaffolding(projectRoot) {
  // Same as inject but reports updated vs new
  const results = { updated: [], added: [], failed: [] };

  for (const entry of SCAFFOLD_MANIFEST) {
    const fullPath = path.join(projectRoot, entry.local);
    const exists = fs.existsSync(fullPath);
    try {
      process.stdout.write(chalk.dim(`  Fetching ${entry.local}...`));
      const content = await fetchRemoteFile(entry.remote);
      writeFile(projectRoot, entry.local, content);
      const label = exists ? chalk.blue('↑') : chalk.green('+');
      process.stdout.write(`\r  ${label} ${entry.local}\n`);
      if (exists) results.updated.push(entry.local);
      else results.added.push(entry.local);
    } catch (err) {
      process.stdout.write(`\r  ${chalk.red('✗')} ${entry.local} ${chalk.dim(`(${err.message})`)}\n`);
      results.failed.push(entry.local);
    }
  }

  return results;
}

module.exports = { injectScaffolding, updateScaffolding, SCAFFOLD_MANIFEST };
