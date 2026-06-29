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

## Deploying and packaging

### 1. Create the GitHub repo

Create a **private** repo: `github.com/alto-tyler/alto-rootstock-cli`

This repo is separate from `rootstock-agent-distribution` — it's the CLI source code only.

### 2. Push the code

```bash
cd alto-rootstock-cli
git init
git add .
git commit -m "Initial release"
git remote add origin git@github.com:alto-tyler/alto-rootstock-cli.git
git push -u origin main
```

### 3. Publish a version

Tag a release — GitHub Actions publishes it automatically to GitHub Packages:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow in `.github/workflows/publish.yml` runs `npm publish` to npmjs.com using the `NPM_TOKEN` secret (add this in the repo Settings → Secrets → Actions).

---

## How users install it

No auth required — the package is public on npmjs.com:

```bash
npm install -g @altotyler/alto-rootstock-cli
```

After install, run `altors install` once to save your GitHub token for fetching skill files from the private distribution repo.

After the one-time setup, updates are one command:

```bash
npm update -g @altotyler/alto-rootstock-cli
altors install   # updates global VS Code agent files
```

---

## How the update notification works

Every time `altors` runs any command, it fetches `version.json` from the distribution repo in the background (2.5s timeout, non-blocking). If the remote `cliVersion` is newer than the installed version, it prints after the command:

```
┌──────────────────────────────────────────────────────┐
│  Update available: 1.0.0 → 1.2.0                    │
│  Run: npm update -g @altotyler/alto-rootstock-cli  │
└──────────────────────────────────────────────────────┘
```

To support this, keep `version.json` in `rootstock-agent-distribution` updated with a `cliVersion` field:

```json
{
  "version": "1.0.0",
  "cliVersion": "1.2.0"
}
```

---

## Repository layout

```
alto-rootstock-cli/          ← this repo (CLI source, publish to GitHub Packages)
├── bin/altors.js
├── src/
│   ├── commands/new.js
│   ├── commands/update.js
│   ├── commands/install.js
│   └── lib/
│       ├── config.js        ← ~/.alto-rootstock/config.json + ~/.npmrc auth
│       ├── fetcher.js       ← GitHub raw file fetcher (auth-aware)
│       ├── scaffold.js      ← writes IDE files into project
│       └── updater.js       ← version check (non-blocking)
├── project-template/        ← template files (publish to rootstock-agent-distribution)
│   └── vscode/tasks.json
└── .github/workflows/publish.yml

rootstock-agent-distribution/   ← separate repo (skill files + version manifest)
├── version.json                 ← bump cliVersion here to trigger update notices
└── project-template/
    ├── claude/CLAUDE.md
    ├── claude/skills/*.md
    ├── cursor/rules/rootstock.mdc
    ├── github/agents/Rootstock Agent.agent.md
    ├── github/copilot-instructions.md
    └── vscode/mcp.json + tasks.json
```

---

## Releasing a new version

1. Update `version` in `package.json`
2. Commit and tag: `git tag v1.x.x && git push origin v1.x.x`
3. GitHub Actions publishes to GitHub Packages
4. Update `cliVersion` in `rootstock-agent-distribution/version.json`
5. Users see the update prompt on their next `altors` command
