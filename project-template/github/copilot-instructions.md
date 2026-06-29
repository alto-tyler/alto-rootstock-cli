# Rootstock Project — Copilot Instructions

This repo uses Rootstock ERP (Salesforce managed package, rstk__/rstkf__ namespaces).

For detailed Rootstock guidance, read the relevant skill file before answering:

- SOAPI flows → `.claude/skills/rootstock-soapi.md`
- SYDATA (inventory/cost processing) → `.claude/skills/rootstock-sydata.md`
- SYDATAT (inventory transfers) → `.claude/skills/rootstock-sydatat.md`
- POLOADER → `.claude/skills/rootstock-poloader.md`
- Manufacturing/WO → `.claude/skills/rootstock-manufacturing.md`
- Inventory/item masters → `.claude/skills/rootstock-inventory.md`
- Testing, factories, coverage → `.claude/skills/rootstock-testing.md`
- Debugging, org inspection → `.claude/skills/rootstock-debug.md`
- Core rules and scope → `.claude/skills/rootstock-core.md`

## Non-Negotiables

- `triggeroptions = 'UT'` is for Apex tests ONLY. Never set in production code.
- SYDATA ≠ SYDATAT — they are different objects with different purposes.
- Always check required baseline setup records before diagnosing code issues.
- Prefer Rootstock data factories over ad hoc record creation in tests.
- For full agent capabilities, use the Rootstock Agent (`.github/agents/Rootstock Agent.agent.md`).
