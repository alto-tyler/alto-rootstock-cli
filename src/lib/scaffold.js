'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

const MARKETPLACE = 'alto-rootstock';
const PLUGIN = 'rootstock';
const PLUGINS = ['salesforce', PLUGIN];
const SKILLS_REPO = 'alto-tyler/alto-rootstock-skills';
const MCP_SERVER = 'Salesforce DX';

const CLAUDE_MD = `# Rootstock Project

This is a Salesforce DX project using Rootstock ERP (managed package, rstk__/rstkf__ namespaces).

Guidance comes from the \`salesforce\` and \`${PLUGIN}\` Claude Code plugins (marketplace \`${MARKETPLACE}\`). Load \`${PLUGIN}:core\` before any Rootstock work, then the specific \`${PLUGIN}:*\` skill for the object or flow involved.

- **NEVER set \`rstk__triggeroptions__c\` / \`rstkf__triggeroptions__c\` in production code — \`'UT'\` is for Apex tests only. It suppresses Rootstock automation in live data.**
- Verify the target org in \`.sf/config.json\` before deploying.
- Before creating or renaming any metadata, follow the prefixes below. If they are not set, use the \`salesforce:metadata-prefixes\` skill to ask the user and fill in this section.

## Metadata Prefixes

Not set yet.
`;

const MCP_ENTRY = {
  command: 'npx',
  args: ['-y', '@salesforce/mcp@latest', '--orgs', 'DEFAULT_TARGET_ORG', '--toolsets', 'orgs,metadata,data,users,testing'],
};

const LEGACY_SKILLS = ['core', 'soapi', 'sydata', 'sydatat', 'poloader', 'manufacturing', 'inventory', 'testing', 'debug', 'session']
  .map(s => `.claude/skills/rootstock-${s}.md`);

const LEGACY_FILES = [
  ...LEGACY_SKILLS,
  '.cursor/rules/rootstock.mdc',
  '.github/agents/Rootstock Agent.agent.md',
  '.github/copilot-instructions.md',
  'docs/rootstock-poloader-modes.csv',
  'docs/rootstock-soapi-modes.csv',
  'docs/rootstock-sydata-txn-types.csv',
  'docs/rootstock-sydatat-txn-id.csv',
  'docs/rootstock-field-help-sample.md',
];

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

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return undefined;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function log(symbol, rel) {
  console.log(`  ${symbol} ${rel}`);
}

// Merges into existing JSON rather than overwriting so user-added keys survive.
function mergeJsonFile(projectRoot, rel, mutate) {
  const file = path.join(projectRoot, rel);
  const existing = readJson(file);
  if (existing === undefined) {
    log(chalk.yellow('⚠'), `${rel} ${chalk.dim('(not valid JSON — left unchanged)')}`);
    return;
  }
  const data = existing || {};
  const before = JSON.stringify(data);
  mutate(data);
  if (existing && JSON.stringify(data) === before) {
    log(chalk.dim('='), rel);
    return;
  }
  writeJson(file, data);
  log(existing ? chalk.blue('↑') : chalk.green('+'), rel);
}

function writeProjectFiles(projectRoot, { replaceClaudeMd }) {
  mergeJsonFile(projectRoot, '.claude/settings.json', (s) => {
    // Pre-2.0 templates put MCP servers here, which Claude Code ignores.
    if (s.mcpServers && Object.keys(s.mcpServers).every(k => k === MCP_SERVER)) delete s.mcpServers;
    s.extraKnownMarketplaces = s.extraKnownMarketplaces || {};
    s.extraKnownMarketplaces[MARKETPLACE] = { source: { source: 'github', repo: SKILLS_REPO } };
    s.enabledPlugins = s.enabledPlugins || {};
    for (const p of PLUGINS) s.enabledPlugins[`${p}@${MARKETPLACE}`] = true;
  });

  mergeJsonFile(projectRoot, '.mcp.json', (m) => {
    m.mcpServers = m.mcpServers || {};
    if (!m.mcpServers[MCP_SERVER]) m.mcpServers[MCP_SERVER] = MCP_ENTRY;
  });

  const claudeMd = path.join(projectRoot, '.claude', 'CLAUDE.md');
  if (!fs.existsSync(claudeMd) || replaceClaudeMd(fs.readFileSync(claudeMd, 'utf8'))) {
    const existed = fs.existsSync(claudeMd);
    fs.mkdirSync(path.dirname(claudeMd), { recursive: true });
    fs.writeFileSync(claudeMd, CLAUDE_MD, 'utf8');
    log(existed ? chalk.blue('↑') : chalk.green('+'), '.claude/CLAUDE.md');
  } else {
    log(chalk.dim('='), '.claude/CLAUDE.md');
  }
}

function removeIfEmpty(dir, stopAt) {
  while (dir.startsWith(stopAt) && dir !== stopAt && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

function removeFile(projectRoot, rel, removed) {
  const file = path.join(projectRoot, rel);
  if (!fs.existsSync(file)) return;
  fs.unlinkSync(file);
  removeIfEmpty(path.dirname(file), projectRoot);
  log(chalk.red('−'), rel);
  removed.push(rel);
}

// Removes only the Salesforce DX server we added; deletes the file if nothing else is left.
function pruneMcpServer(projectRoot, rel, key, removed) {
  const file = path.join(projectRoot, rel);
  const data = readJson(file);
  if (!data || !data[key] || !data[key][MCP_SERVER]) return;
  delete data[key][MCP_SERVER];
  if (Object.keys(data[key]).length === 0) delete data[key];
  if (Object.keys(data).length === 0) return removeFile(projectRoot, rel, removed);
  writeJson(file, data);
  log(chalk.blue('↑'), `${rel} ${chalk.dim(`(removed "${MCP_SERVER}")`)}`);
}

function pruneVsCodeTasks(projectRoot, removed) {
  const rel = '.vscode/tasks.json';
  const file = path.join(projectRoot, rel);
  const data = readJson(file);
  if (!data || !Array.isArray(data.tasks)) return;
  const kept = data.tasks.filter(t => !(t.label || '').startsWith('Rootstock:'));
  if (kept.length === data.tasks.length) return;
  if (kept.length === 0) return removeFile(projectRoot, rel, removed);
  data.tasks = kept;
  writeJson(file, data);
  log(chalk.blue('↑'), `${rel} ${chalk.dim('(removed Rootstock tasks)')}`);
}

function removeLegacyFiles(projectRoot) {
  const removed = [];
  for (const rel of LEGACY_FILES) removeFile(projectRoot, rel, removed);
  pruneMcpServer(projectRoot, '.cursor/mcp.json', 'mcpServers', removed);
  pruneMcpServer(projectRoot, '.vscode/mcp.json', 'servers', removed);
  pruneVsCodeTasks(projectRoot, removed);
  return removed;
}

function removeGlobalCopilotAgent() {
  const file = path.join(getVsCodeAgentDir(), 'Rootstock Agent.agent.md');
  if (!fs.existsSync(file)) return null;
  fs.unlinkSync(file);
  return file;
}

function printPluginHelp() {
  console.log(chalk.dim(`  Skills come from the ${PLUGINS.join(' and ')} Claude Code plugins. If /${PLUGIN}:core is missing in Claude Code:`));
  console.log(chalk.dim(`    1. Make sure your GitHub account has access to ${SKILLS_REPO} and git is signed in (gh auth login)`));
  console.log(chalk.dim(`    2. In Claude Code: /plugin marketplace add ${SKILLS_REPO}`));
  console.log(chalk.dim('    3. Then run:'));
  for (const p of PLUGINS) console.log(chalk.dim(`         /plugin install ${p}@${MARKETPLACE}`));
}

function injectScaffolding(projectRoot) {
  writeProjectFiles(projectRoot, { replaceClaudeMd: () => false });
}

function migrateProject(projectRoot) {
  const removed = removeLegacyFiles(projectRoot);
  writeProjectFiles(projectRoot, {
    // Only replace the old router this CLI generated; leave hand-written CLAUDE.md files alone.
    replaceClaudeMd: (content) => content.includes('# Rootstock Project — Agent Router'),
  });
  return { removed };
}

module.exports = {
  injectScaffolding,
  migrateProject,
  removeGlobalCopilotAgent,
  printPluginHelp,
};
