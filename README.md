# alto-rootstock-cli

CLI for creating Rootstock Salesforce DX projects set up for Claude Code.

The skills live in the private [`alto-tyler/alto-rootstock-skills`](https://github.com/alto-tyler/alto-rootstock-skills) Claude Code plugin marketplace, not in this CLI. That repo ships two plugins: `salesforce` (Alto project practices such as metadata prefixes) and `rootstock` (Rootstock ERP). They install once per user and work in every project. See that repo's README for access and setup.

## Commands

```
altors new      Create a new SFDX project set up for Claude Code and the Rootstock plugins
altors update   Move an existing project to the plugins (removes old skill, Cursor, and Copilot files)
```

`altors new` runs `sf project generate`, then adds:
- `.claude/CLAUDE.md`: short project instructions, the triggeroptions rule, and an empty **Metadata Prefixes** section that Claude fills in on first use
- `.claude/settings.json`: points Claude Code at the `alto-rootstock` marketplace and enables both plugins
- `.mcp.json`: the Salesforce DX MCP server

`altors update` is for projects created with altors 1.x. It:
- deletes the copied `.claude/skills/rootstock-*.md` files, the Cursor rules, the Copilot agent and instructions, and the `docs/rootstock-*` reference files
- removes only the Salesforce DX entries and `Rootstock:` tasks from `.vscode/` and `.cursor/` config, leaving anything else in those files
- replaces the old generated `CLAUDE.md` router (a hand-written `CLAUDE.md` is left alone)
- deletes the global VS Code Copilot agent that `altors install` used to add

Review the changes and commit them.

## Install

```bash
npm install -g @altotyler/alto-rootstock-cli@latest --prefer-online
```

The CLI needs no sign-in. Access to the skills is controlled by who has access to the GitHub repo.

`npm update -g` and even plain `npm install -g pkg@latest` can resolve against npm's stale local metadata cache and silently skip a version. `--prefer-online` forces npm to check the registry.

## Update notification

Every `altors` command fetches `version.json` from this repo's `main` branch in the background (2.5s timeout, unauthenticated). If `cliVersion` there is newer than the installed version, it prints an update notice after the command.

## Releasing

1. Update `version` in `package.json`
2. Commit and tag: `git tag v2.x.x && git push origin v2.x.x`
3. GitHub Actions publishes to npmjs.com (requires the `NPM_TOKEN` secret)
4. Bump `cliVersion` in `version.json` so users see the update notice

## Layout

```
bin/altors.js           entry point + update notification
version.json            bump cliVersion to trigger update notices
src/commands/new.js     sf project generate + project files
src/commands/update.js  1.x → plugin migration
src/lib/scaffold.js     project file templates and legacy file cleanup
src/lib/updater.js      background version check
scripts/postinstall.js  adds npm's global bin folder to PATH if missing
```
