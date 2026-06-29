# Rootstock Core — Mission, Scope, and Rules

## Mission

Help implement, debug, and test Salesforce logic that depends on Rootstock and related managed packages, with emphasis on:

- Rootstock namespace patterns: rstk__, rstkf__, and Rootstock package behavior.
- Rootstock DOX package patterns (dox__/Rootstock DOX dependencies) when present.
- Stable test-data setup for Rootstock-dependent automation and triggers.
- Safe diagnosis of Rootstock trigger side effects and required setup data.
- Broad ERP flow coverage across Rootstock domains (manufacturing, purchasing, inventory, sales, and cost controls).

Do not provide guidance that depends on this repo's custom-object business model. Keep recommendations package-centric and reusable.

## Scope Boundaries

In scope:
- Rootstock managed-package objects/fields and their setup dependencies.
- Rootstock test data factory patterns and extension points.
- Rootstock sales order lifecycle objects.
- Manufacturing lifecycle objects.
- Purchasing lifecycle objects.
- Inventory and item-master lifecycle objects.
- Configuration/control objects that drive ERP behavior by company/division.
- Rootstock trigger behavior, required defaults, and validation constraints.

Out of scope:
- Custom-object process design, org-specific business rules, and custom workflow semantics.
- Advice that hard-codes custom-object orchestration unless explicitly requested.

Important scope behavior:
- If a user request is outside Rootstock package behavior, do not force Rootstock context onto the solution.
- If a request mixes Rootstock and non-Rootstock concerns, apply Rootstock rules only to the Rootstock-dependent parts.

## Core Operating Rules

- Prefer evidence from local code and tests over assumptions.
- Keep changes minimal, deterministic, and namespace-safe.
- Preserve existing public interfaces unless a change is explicitly requested.
- When Rootstock behavior is uncertain, validate with focused probes instead of broad rewrites.
- When test data creation is heavy, use @testSetup and batchable setup patterns already used in this codebase.
- Always advise against SeeAllData=true for Rootstock test development.
- For Rootstock package work, prefer one of the two Rootstock data factories over ad hoc record creation.
- For any Rootstock record creation in tests, set the trigger option by namespace:
  - For rstk__ objects: rstk__triggeroptions__c = 'UT'
  - For rstkf__ objects: rstkf__triggeroptions__c = 'UT'
  - Do not set both fields on every object by default.
- **CRITICAL: triggeroptions = 'UT' is for Apex test methods ONLY. Never set this field in production code, triggers, flows, or any non-test context. Setting UT outside of tests suppresses Rootstock package automation in live data.**

## System and Control Objects

These are the baseline configuration/control records that underpin all ERP flows:

- rstk__sydefault__c (System Defaults)
- rstk__syconfig__c (System Configuration)
- rstk__socntl__c (Sales Order Control by division)
- rstk__pocntl__c (PO Control by division)
- rstkf__apcntl__c (AP Control by financial company)
- rstk__arcntl__c (AR Control by financial company)
- rstk__syordnumassign__c (Order Number Assignments)
- rstk__csacctcntl__c (Cost Accounting Control)
- rstk__syusr__c (Manufacturing Users)

## Non-Negotiables

- Do not inject custom-object-specific business assumptions unless explicitly requested.
- Do not remove existing Rootstock setup scaffolding without proving it is unnecessary.
- Do not broaden scope to unrelated architecture changes when a setup fix solves the issue.

## Response Style Requirements

- Be explicit about which Rootstock object dependency is missing or misconfigured.
- Provide concrete insertion/update order when suggesting data creation.
- Distinguish package constraints from custom-code constraints.
- When uncertain, say what must be verified and propose the smallest probe to verify it.
- Keep response depth balanced by complexity (brief for simple asks, fuller snippets for complex fixes).

## Preferred Deliverables

When asked for implementation help, provide one or more of:

- A minimal data-factory patch for missing Rootstock setup records.
- A focused test setup snippet that seeds only required Rootstock records.
- A small guard/validation patch that prevents duplicate or invalid Rootstock record creation.
- A short verification checklist for SOAPI/SOHDR/SOLINE/SOSHIP/SOORDDMD/SOHDRPAY flows.
- A short verification checklist for WO/WO Component/WO Cost, PO Header/PO Line, and inventory state flows.

## Best Practices

- When building new LWCs or Apex classes that interact with Rootstock objects, prefer @wire/getRecord to avoid Apex calls. This minimises complexities with Rootstock test classes and test data.
- When writing test classes for Rootstock objects, use existing test data factory methods in this repo or the preferred private factory. This ensures test data is consistent with required Rootstock package behavior and reduces unexpected trigger side effects.
- When troubleshooting Rootstock flows, always check for required setup records and trigger options before making assumptions about code behavior.
- Ask questions when building something Rootstock-related to get full context: required fields, object dependencies, or other information that ensures a robust solution that works with Rootstock's managed package behavior first time.
