# Rootstock Debugging — Strategy, Org Inspection, and Community Research

## Debugging Strategy

When diagnosing Rootstock issues, execute in this order:

1. Confirm required baseline setup records exist (syconfig, company, division, site, UOM, controls).
2. Confirm triggeroptions mode and execution user context.
3. Isolate failure to the earliest transactional object in the chain (sohdr, then soline, then dependent records).
4. Inspect managed-package validation/trigger side effects before changing business logic.
5. Add or adjust setup data first; only then alter production logic.
6. If unresolved or ambiguous, ask the user how they want to proceed rather than guessing org-specific behavior.

## Org Metadata and Control Inspection

Use org metadata and live control data before making assumptions.

1. Query active control/settings records via Salesforce DX MCP SOQL.
2. Query object definitions via EntityDefinition where needed.
3. If FieldDefinition/EntityParticle metadata queries are not supported in the org API path, use CLI describe fallback:
   ```
   sf sobject describe --sobject <objectApiName> --target-org <org>
   ```
4. Prioritize field help text and labels from describe output when explaining what a setting does.
5. Keep test/setup recommendations aligned to observed org controls, not generic defaults.

Reference artifact in this repo: docs/rootstock-field-help-sample.md

## Proactive Org Querying

When answering questions about SYDATAT, SYDATA, SOAPI, or POLOADER, proactively query the org for relevant existing records before answering. Use Salesforce DX MCP SOQL first. If MCP is unavailable, fall back to CLI:
```
sf data query --query "<SOQL>" --target-org <org>
```

Useful context queries:
- SYDATAT: `SELECT Id, rstk__sydatat_txnid__c, rstk__sydatat_process__c, rstk__sydatat_message__c FROM rstk__sydatat__c ORDER BY CreatedDate DESC LIMIT 5`
- SYDATA: `SELECT Id, rstk__sydata_txntype__c, rstk__sydata_process__c, rstk__sydata_message__c FROM rstk__sydata__c ORDER BY CreatedDate DESC LIMIT 5`
- ICLocItem: `SELECT Id, Name, rstk__iclocitem_item__c, rstk__iclocitem_loc__c, rstk__iclocitem_qtyonhand__c FROM rstk__iclocitem__c LIMIT 10`
- SOAPI: `SELECT Id, rstk__soapi_mode__c, rstk__soapi_process__c, rstk__soapi_message__c FROM rstk__soapi__c ORDER BY CreatedDate DESC LIMIT 5`
- POLOADER: `SELECT Id, rstk__poloader_mode__c, rstk__poloader_process__c, rstk__poloader_message__c FROM rstk__poloader__c ORDER BY CreatedDate DESC LIMIT 5`

Summarize what you found (or that no records exist) so the user understands their org's current state. Do not skip org querying just because canonical CSV values are available — live data reveals active field usage, error patterns, and configuration state that static references cannot.

## Rootstock Community Research

For SYDATAT, SYDATA, SOAPI, and POLOADER questions, always run a Rootstock Community search upfront — do not rely solely on local code or canonical CSVs. These transaction objects have detailed field documentation, import templates, and known-issue articles in the community that are not captured locally.

For all other questions, when local code, tests, and org metadata are insufficient, web research is allowed.

Treat local project context as potentially incomplete for Rootstock package behavior. If the current repo does not contain enough package-specific evidence, use Rootstock Community search before concluding that an answer is unavailable.

Search Rootstock Success Community:
- https://community.rootstock.com/s/global-search/<searchvalue>

If global search returns known issues, case discussions, or solution articles, summarize the top matches and direct the user to those links.

Guidelines:
- Do not fabricate case IDs, issue IDs, or article content when search results are empty or access-limited.
- If results seem sparse, remind the user that logging in can expand visibility: https://community.rootstock.com/s/login/
- Import templates for SOAPI, SYDATA/SYDATAT, and POLOADER are often discoverable via global search; direct the user to those template links when found.
- Do not assume the agent can use the user's browser session automatically; if login-gated pages are needed, ask the user to log in and share links/content that remains inaccessible from tooling.
- Prefer package/version-neutral findings unless the user asks for a version-specific answer.
- Treat community findings as supplemental and verify against observed org metadata and behavior before prescribing changes.
- Before saying information is unknown or unavailable, run at least one Rootstock Community global search query relevant to the user request and summarize what was found (or explicitly that no visible results were returned).
