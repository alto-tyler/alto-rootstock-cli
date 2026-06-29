'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { fetchRemoteFile } = require('./fetcher');

const TEMPLATE_DIR = path.join(__dirname, '../../project-template');

// Maps template-relative paths → local project paths
const SCAFFOLD_MANIFEST = [
  { template: 'claude/CLAUDE.md',                              local: '.claude/CLAUDE.md' },
  { template: 'claude/skills/rootstock-core.md',               local: '.claude/skills/rootstock-core.md' },
  { template: 'claude/skills/rootstock-soapi.md',              local: '.claude/skills/rootstock-soapi.md' },
  { template: 'claude/skills/rootstock-sydata.md',             local: '.claude/skills/rootstock-sydata.md' },
  { template: 'claude/skills/rootstock-sydatat.md',            local: '.claude/skills/rootstock-sydatat.md' },
  { template: 'claude/skills/rootstock-poloader.md',           local: '.claude/skills/rootstock-poloader.md' },
  { template: 'claude/skills/rootstock-manufacturing.md',      local: '.claude/skills/rootstock-manufacturing.md' },
  { template: 'claude/skills/rootstock-inventory.md',          local: '.claude/skills/rootstock-inventory.md' },
  { template: 'claude/skills/rootstock-testing.md',            local: '.claude/skills/rootstock-testing.md' },
  { template: 'claude/skills/rootstock-debug.md',              local: '.claude/skills/rootstock-debug.md' },
  { template: 'claude/skills/rootstock-session.md',            local: '.claude/skills/rootstock-session.md' },
  { template: 'cursor/rules/rootstock.mdc',                    local: '.cursor/rules/rootstock.mdc' },
  { template: 'github/agents/Rootstock Agent.agent.md',        local: '.github/agents/Rootstock Agent.agent.md' },
  { template: 'github/copilot-instructions.md',                local: '.github/copilot-instructions.md' },
  { template: 'cursor/mcp.json',                               local: '.cursor/mcp.json' },
  { template: 'claude/settings.json',                          local: '.claude/settings.json' },
  { template: 'vscode/mcp.json',                               local: '.vscode/mcp.json' },
  { template: 'vscode/tasks.json',                             local: '.vscode/tasks.json' },
];

function writeFile(projectRoot, relPath, content) {
  const full = path.join(projectRoot, relPath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

// Used by `altors new` — reads from bundled project-template (fast, works offline)
async function injectScaffolding(projectRoot) {
  const results = { ok: [], failed: [] };

  for (const entry of SCAFFOLD_MANIFEST) {
    const src = path.join(TEMPLATE_DIR, entry.template);
    try {
      const content = fs.readFileSync(src, 'utf8');
      writeFile(projectRoot, entry.local, content);
      console.log(`  ${chalk.green('✓')} ${entry.local}`);
      results.ok.push(entry.local);
    } catch (err) {
      console.log(`  ${chalk.red('✗')} ${entry.local} ${chalk.dim(`(${err.message})`)}`);
      results.failed.push(entry.local);
    }
  }

  return results;
}

// Used by `altors update` — fetches latest from remote distribution repo
async function updateScaffolding(projectRoot) {
  const results = { updated: [], added: [], failed: [] };

  for (const entry of SCAFFOLD_MANIFEST) {
    const fullPath = path.join(projectRoot, entry.local);
    const exists = fs.existsSync(fullPath);
    try {
      process.stdout.write(chalk.dim(`  Fetching ${entry.local}...`));
      const content = await fetchRemoteFile(`project-template/${entry.template}`);
      writeFile(projectRoot, entry.local, content);
      const label = exists ? chalk.blue('↑') : chalk.green('+');
      process.stdout.write(`\r${' '.repeat(70)}\r  ${label} ${entry.local}\n`);
      if (exists) results.updated.push(entry.local);
      else results.added.push(entry.local);
    } catch (err) {
      process.stdout.write(`\r${' '.repeat(70)}\r  ${chalk.red('✗')} ${entry.local} ${chalk.dim(`(${err.message})`)}\n`);
      results.failed.push(entry.local);
    }
  }

  return results;
}

module.exports = { injectScaffolding, updateScaffolding, SCAFFOLD_MANIFEST };
