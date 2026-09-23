# alto-rootstock-cli

CLI for creating and managing Rootstock Salesforce DX projects with AI agent scaffolding pre-installed for Claude Code, Cursor, and VS Code Copilot.

## What it does

```
altors new      Create a new SFDX project with Rootstock agent skills injected
altors update   Update Rootstock skill files in the current project
altors install  Install/update the global Rootstock agent for VS Code Copilot
altors login    Sign in with your @altoconsultants.ca Google account
altors logout   Sign out and clear the saved session
altors whoami   Show the currently signed-in account
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
- **Rootstock: Update Skills** — pulls latest skill files through the auth proxy
- **Rootstock: Check Version** — shows installed CLI version
- **Rootstock: Install Global Agent** — installs the VS Code Copilot agent globally

---

## How users install it

The npm package is public — no auth needed to install the CLI itself:

```bash
npm install -g @altotyler/alto-rootstock-cli
altors login      # sign in with your @altoconsultants.ca Google account (opens a browser)
```

The actual skill/docs content lives in a private repo and is only served after
Google Sign-In restricted to `@altoconsultants.ca` — see [`proxy/README.md`](proxy/README.md)
for how that's wired up. Nobody handles a GitHub token; signing in with your
normal work Google account is the entire auth step.

Updates are one command:

```bash
npm install -g @altotyler/alto-rootstock-cli@latest
altors install   # re-fetches latest global VS Code agent files
```

(`npm update -g` looks equivalent but can silently resolve against npm's own
stale local package metadata cache and skip a version — `install ...@latest`
always asks the registry directly for the current release.)

Sessions last 90 days; `altors login` again if yours expires.

---

## How the update notification works

Every time `altors` runs any command, it fetches `version.json` from this
repo's own `main` branch in the background (2.5s timeout, non-blocking,
unauthenticated — this check has to work even before anyone has signed in).
If the remote `cliVersion` is newer than the installed version, it prints
after the command:

```
┌──────────────────────────────────────────────────────┐
│  Update available: 1.0.0 → 1.2.0                    │
│  Run: npm install -g @altotyler/alto-rootstock-cli@latest │
└──────────────────────────────────────────────────────┘
```

To trigger update notices, bump `cliVersion` in this repo's `version.json`.

---

## Releasing a new CLI version

1. Update `version` in `package.json`
2. Commit and tag: `git tag v1.x.x && git push origin v1.x.x`
3. GitHub Actions publishes to npmjs.com automatically (requires `NPM_TOKEN` secret in repo Settings → Secrets → Actions)
4. Bump `cliVersion` in this repo's `version.json`
5. Users see the update prompt on their next `altors` command

---

## Repository layout

```
alto-rootstock-cli/                 ← this repo (CLI source, public, published to npmjs.com)
├── bin/altors.js                   ← entry point + update notification
├── version.json                    ← bump cliVersion here to trigger update notices
├── src/
│   ├── commands/{new,update,install,login,logout,whoami}.js
│   └── lib/
│       ├── config.js               ← ~/.alto-rootstock/config.json (proxy URL, session)
│       ├── auth.js                 ← altors login/logout/whoami (local callback server)
│       ├── fetcher.js              ← proxy-authenticated content fetch + public version check
│       ├── scaffold.js             ← file manifest + writer
│       └── updater.js              ← background version check
└── .github/workflows/publish.yml   ← auto-publishes to npmjs.com on git tag push

proxy/                               ← Cloudflare Worker (this repo, not published to npm)
├── worker.js                        ← Google-authenticated gateway to the private skills repo
├── wrangler.toml
└── README.md                        ← deployment checklist

alto-tyler/alto-rootstock-skills     ← separate PRIVATE repo — the actual skill/docs content
├── claude/CLAUDE.md, claude/skills/ ← 10 Rootstock skill files
├── cursor/rules/rootstock.mdc
├── github/agents/Rootstock Agent.agent.md
├── github/copilot-instructions.md
├── vscode/mcp.json + tasks.json
├── docs/                            ← Rootstock field/transaction reference docs
└── scripts/agent/                   ← legacy PowerShell installer (pre-dates altors)
```

`alto-tyler/rootstock-agent-distribution` (an older, separate distribution
mechanism that predated `altors`) has been folded into `alto-rootstock-skills`
and is now private + archived rather than deleted.
