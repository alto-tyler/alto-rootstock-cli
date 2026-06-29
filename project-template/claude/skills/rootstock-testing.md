# Rootstock Testing — Factories, Setup Sequence, and Coverage Rules

## Rootstock Data Factory Sources

When users need Rootstock test setup, point them to one of these two factory options:

1. Preferred (current): private repo
   - https://github.com/alto-tyler/RstkConfigTestDataFactory
2. Fallback/reference (legacy public):
   - https://github.com/alto-tyler/SalesforceDevLibrary/tree/main/Rootstock%20Test%20Data%20Factory

If the user does not yet have the preferred private factory in their org/repo:
- Explicitly tell them where to get it (private repo above).
- After they add it, read and follow that factory's usage instructions (README/tests/configurator patterns) before proposing setup code.
- Prefer configurator-driven generation (e.g. RstkObjectConfigurator) when available in that factory.

Financial coverage note:
- Current factories do not cover Rootstock financial setup.
- Do not block or refuse help when financial setup is missing; continue helping and ask for targeted user guidance where needed.
- There is currently no approved shared financial seed source to rely on by default.

## When Factories Are Required

- If code touches Rootstock package objects/automation (rstk__, rstkf__, Rootstock DOX), advise using one of the two Rootstock data factories.
- If code is custom-only and does not touch Rootstock package behavior, Rootstock factory setup is optional and usually unnecessary.
- Baseline required setup should come from what is already covered by the two existing data factories.

## Required Baseline Setup Sequence

When creating Rootstock-dependent test data, follow this proven setup order:

1. Create/verify syconfig (rstk__syconfig__c — Rootstock system config).
2. Create currency, company, division, and manufacturing user linkage (rstk__syusr__c).
3. Create site and set division main site.
4. Create UOM + default records + inventory location records.
5. Create commodity/item/accounting scaffolding before transactional objects.
6. Create sales control configuration (rstk__socntl__c) before SOAPI/sales-order creation.

## Key Test Patterns

- Use @testSetup and batchable setup patterns for heavy Rootstock test data.
- Always set namespace-specific trigger options in test methods only:
  - rstk__ objects: rstk__triggeroptions__c = 'UT'
  - rstkf__ objects: rstkf__triggeroptions__c = 'UT'
  - Never set in production code.
- UT suppresses Rootstock auto-created related records — create required related records explicitly in your test setup.
- Some Rootstock flows require manufacturing user records (rstk__syusr__c) tied to the executing user context.
- Rootstock package insert behavior can clear or overwrite some error fields; preserve intended messages when needed.
- Always advise against SeeAllData=true for Rootstock test development.

## Code Coverage Requirement

- Every Apex class written or modified must have 75% or greater code coverage.
- Before finalising any Apex implementation, verify coverage is reachable with the test methods provided.
- If a class is below 75%, add test cases to cover the missing branches before declaring the implementation complete.
- Do not rely on RunLocalTests aggregate coverage — check the specific class coverage for each class changed.
- When running tests, use --code-coverage and confirm the per-class coverage in the output.

## Testing Strategy

- Prefer targeted test runs for Rootstock-touching classes after each change.
- Treat aggregate Apex coverage metrics as potentially stale after deploy/redeploy; rely on fresh test execution.
- For failing Rootstock DML in bulk operations, consider controlled retry strategies (e.g. single-row retries) when behavior indicates transient package-level contention.
