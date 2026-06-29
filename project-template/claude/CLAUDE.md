# Rootstock Project — Agent Router

This repo uses Rootstock ERP (Salesforce managed package, rstk__/rstkf__ namespaces).

Before answering Rootstock questions, use the Read tool to load only the skill files you need. Do not load all files by default.

## Skill Router

| Topic | Load this file |
|-------|---------------|
| Mission, scope, core rules, non-negotiables, best practices | `.claude/skills/rootstock-core.md` |
| SOAPI modes, sales order object chain (sohdr/soline/soship/soorddmd/sohdrpay) | `.claude/skills/rootstock-soapi.md` |
| SYDATA transaction types, inventory/cost processing, async queue | `.claude/skills/rootstock-sydata.md` |
| SYDATAT transaction IDs, inventory transfers between locations/sites/divisions | `.claude/skills/rootstock-sydatat.md` |
| POLOADER modes, purchasing object chain (pocntl/pohdr/poline/poitem) | `.claude/skills/rootstock-poloader.md` |
| Work orders, WO components, cost transactions, manufacturing flows | `.claude/skills/rootstock-manufacturing.md` |
| Item masters (peitem/icitem/soprod/poitem), inventory state (iclocitem/icitemlot/icitemsrl) | `.claude/skills/rootstock-inventory.md` |
| Test data factories, setup sequence, coverage requirements, trigger options | `.claude/skills/rootstock-testing.md` |
| Debugging strategy, org metadata inspection, proactive org queries, community research | `.claude/skills/rootstock-debug.md` |
| Session init, MCP setup, deploy/test preferences, agent updates/upgrades | `.claude/skills/rootstock-session.md` |

## Quick Reference

- Trigger options in tests only: `rstk__triggeroptions__c = 'UT'` (rstk__) / `rstkf__triggeroptions__c = 'UT'` (rstkf__)
- **NEVER set triggeroptions in production code — it suppresses Rootstock automation in live data.**
- SYDATA ≠ SYDATAT: SYDATA processes inventory/cost transactions; SYDATAT moves inventory between locations/sites/divisions.
- Item setup chain: peitem → icitem → soprod (sales) / poitem (purchasing)
- Always check org controls before assuming package behavior.
