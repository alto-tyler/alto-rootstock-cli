# alto-rootstock-cli

CLI for creating and managing Rootstock Salesforce DX projects with AI agent scaffolding pre-installed for Claude Code, Cursor, and VS Code Copilot.

## What it does

```
altors new      Create a new SFDX project with Rootstock agent skills injected
altors update   Update Rootstock skill files in the current project
altors install  Install/update the global VS Code Copilot agent + save GitHub token
```

After `altors new`, the generated project contains:
- `.claude/CLAUDE.md` + `.claude/skills/` — Claude Code (router + 10 skill files)
- `.cursor/rules/rootstock.mdc` — Cursor AI
- `.github/agents/Rootstock Agent.agent.md` — VS Code Copilot
- `.github/copilot-instructions.md` — VS Code Copilot always-on
- `.vscode/mcp.json` — Salesforce DX MCP server
- `.vscode/tasks.json` — Command palette tasks (see below)

## VS Code / Cursor Command Palette

Once a project is open, `Ctrl+Shift+P` → **"Tasks: Run Task"** exposes:
- **Rootstock: Update Skills** — pulls latest skill files from the distribution repo
- **Rootstock: Check Version** — shows installed CLI version
- **Rootstock: Install Global Agent** — installs the VS Code Copilot agent globally

---

## How users install it

No auth required — the package is public on npmjs.com:

```bash
npm install -g @altotyler/alto-rootstock-cli
```

After install, run `altors install` once to save your GitHub token for fetching skill files from the private distribution repo.

Updates are one command:

```bash
npm update -g @altotyler/alto-rootstock-cli
altors install   # re-fetches latest global VS Code agent files
```

---

## How the update notification works

Every time `altors` runs any command, it fetches `version.json` from the distribution repo in the background (2.5s timeout, non-blocking). If the remote `cliVersion` is newer than the installed version, it prints after the command:

```
┌──────────────────────────────────────────────────────┐
│  Update available: 1.0.0 → 1.2.0                    │
│  Run: npm update -g @altotyler/alto-rootstock-cli   │
└──────────────────────────────────────────────────────┘
```

To trigger update notices, bump `cliVersion` in `rootstock-agent-distribution/version.json`:

```json
{
  "version": "1.0.0",
  "cliVersion": "1.2.0"
}
```

---

## Releasing a new CLI version

1. Update `version` in `package.json`
2. Commit and tag: `git tag v1.x.x && git push origin v1.x.x`
3. GitHub Actions publishes to npmjs.com automatically (requires `NPM_TOKEN` secret in repo Settings → Secrets → Actions)
4. Update `cliVersion` in `rootstock-agent-distribution/version.json`
5. Users see the update prompt on their next `altors` command

---

## Repository layout

```
alto-rootstock-cli/               ← this repo (CLI source, published to npmjs.com)
├── bin/altors.js                 ← entry point + update notification
├── src/
│   ├── commands/new.js           ← prompts, runs sf project generate, injects skills
│   ├── commands/update.js        ← updates skill files in current project
│   ├── commands/install.js       ← installs global VS Code agent + saves GitHub token
│   └── lib/
│       ├── config.js             ← ~/.alto-rootstock/config.json token storage
│       ├── fetcher.js            ← GitHub raw file fetcher (auth-aware)
│       ├── scaffold.js           ← file manifest + writer
│       └── updater.js            ← background version check
├── project-template/
│   └── vscode/tasks.json         ← injected into new projects for command palette tasks
└── .github/workflows/publish.yml ← auto-publishes to npmjs.com on git tag push

rootstock-agent-distribution/     ← separate private repo (skill files + version manifest)
├── version.json                  ← bump cliVersion here to trigger update notices
└── project-template/
    ├── claude/CLAUDE.md
    ├── claude/skills/            ← 10 Rootstock skill files
    ├── cursor/rules/rootstock.mdc
    ├── github/agents/Rootstock Agent.agent.md
    ├── github/copilot-instructions.md
    └── vscode/mcp.json + tasks.json
```
