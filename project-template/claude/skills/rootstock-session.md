# Rootstock Session — Initialization, MCP Setup, and Agent Updates

## Session Initialization

On the first substantive interaction in each session, perform the following checks once and do not repeat them.

### MCP Server Setup

Check whether the Salesforce DX MCP server is configured in the workspace:

1. Look for `.vscode/mcp.json` in the workspace root.
2. If the file does not exist, or if it exists but does not contain a `"Salesforce DX"` server entry, offer to create or update it with:

```json
{
  "servers": {
    "Salesforce DX": {
      "command": "npx",
      "args": ["-y", "@salesforce/mcp@latest",
               "--orgs", "DEFAULT_TARGET_ORG",
               "--toolsets", "orgs,metadata,data,users,testing"]
    }
  }
}
```

3. If the user confirms, create or merge the entry into `.vscode/mcp.json`.
4. After creating it, tell the user to reload VS Code or restart the MCP server so tools become available.
5. Do not create or modify the file without user confirmation.

### Deploy and Test Preferences

At the start of any session where Apex or LWC code changes are anticipated, ask the user these two questions once:

1. **Auto-deploy**: "After I make code changes, do you want me to deploy them to the org automatically?"
2. **Auto-test**: "After deploying, should I run the relevant Apex tests?"

Record the answers as session preferences and apply them for the rest of the conversation:
- If auto-deploy is **yes**: run `sf project deploy start` targeting the changed files after each implementation step.
- If auto-test is **yes**: run `sf apex run test` scoped to classes related to the changed code after each deploy.
- If both are **yes**: deploy first, then run tests, then report results inline.
- Do not ask these questions again unless the user changes their preference or starts a clearly unrelated task.

## Agent Update Awareness

Use lightweight update checks so developers are informed when the shared agent definition changes.

Primary source of truth:
- https://raw.githubusercontent.com/alto-tyler/rootstock-agent-distribution/main/version.json

Check cadence:
- Do not check on every prompt.
- Check when the user asks about setup/install/update behavior, and otherwise only occasionally (e.g. once per session or after several Rootstock troubleshooting requests).

Notification behavior:
- If remote version is newer than the local installed version, add a short notice with the update command.
- Keep update notices brief and non-blocking so Rootstock troubleshooting remains primary.

## Agent Upgrade Instructions

When a user asks to upgrade the agent, or when an update is detected and the user confirms, run the appropriate command for their OS.

### Windows (PowerShell)

```powershell
./scripts/agent/install-rootstock-agent.ps1 -SourceMode remote -BaseUrl "https://raw.githubusercontent.com/alto-tyler/rootstock-agent-distribution/main"
```

For private distribution repos:
```powershell
$env:GITHUB_TOKEN = "<token-with-repo-read>"
./scripts/agent/install-rootstock-agent.ps1 -SourceMode remote -BaseUrl "https://raw.githubusercontent.com/alto-tyler/rootstock-agent-distribution/main"
```

### macOS / Linux (requires PowerShell Core)

```bash
brew install --cask powershell  # if pwsh not installed
pwsh ./scripts/agent/install-rootstock-agent.ps1 -SourceMode remote -BaseUrl "https://raw.githubusercontent.com/alto-tyler/rootstock-agent-distribution/main"
```

For private repos on Mac:
```bash
export GITHUB_TOKEN="<token-with-repo-read>"
pwsh ./scripts/agent/install-rootstock-agent.ps1 -SourceMode remote -BaseUrl "https://raw.githubusercontent.com/alto-tyler/rootstock-agent-distribution/main"
```

### Check Before Upgrading

Windows: `./scripts/agent/check-rootstock-agent-update.ps1`
macOS/Linux: `pwsh ./scripts/agent/check-rootstock-agent-update.ps1`

### What the Installer Does

- Windows: installs to `%APPDATA%\Code\User\prompts\agents\Rootstock Agent.agent.md`
- macOS: installs to `~/Library/Application Support/Code/User/prompts/agents/Rootstock Agent.agent.md`
- Also installs supporting docs (field help, certification suite, version manifest) into the same prompts folder.
- Agent becomes available across all VS Code workspaces after reload.

### After Upgrade

1. Reload VS Code (or open a new chat window).
2. Select `Rootstock Agent` in the chat agent picker.
3. Verify by asking the agent its current version.
