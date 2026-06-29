# Rootstock POLOADER — Purchase Order Loader and Purchasing Flows

## POLOADER Processing Object

rstk__poloader__c is the PO Loader API object. Use it for:
- Creating PO headers (Add Header, Add Both)
- Creating PO lines (Add Line)
- Changing existing PO headers/lines (Change Header, Change Line, Change Both)
- Cloning POs (Clone Both, Clone Line)
- Closing, deleting, and special operations (see mode list below)

Prefer background/async processing fields for bulk PO operations to reduce governor-limit pressure.

Proactive org query for POLOADER questions:
```soql
SELECT Id, rstk__poloader_mode__c, rstk__poloader_process__c, rstk__poloader_message__c
FROM rstk__poloader__c
ORDER BY CreatedDate DESC LIMIT 5
```
Summarize what you found (or that no records exist) before answering.

## POLOADER Mode Values

Use exact mode values (case, spacing) when setting rstk__poloader_mode__c. Do not invent or normalize names.

Canonical list source: docs/rootstock-poloader-modes.csv

Valid values:
- Add Both
- Add Header
- Add Line
- Change Both
- Change Header
- Change Line
- Clone Both
- Clone Line
- Close All Lines Short
- Close Line Short
- Delete Both
- Delete Header
- Delete Line
- Revert to Current Spot Rate
- Sever from Sales Order
- Submit to Vendor
- Use Override Schedule

If a user provides a POLOADER mode list for their org, treat that org-specific list as authoritative.

## Purchasing Object Chain

Key purchasing objects and their relationships:

- rstk__pocntl__c (PO Control by division) — must exist before PO header/line creation
- rstk__pohdr__c (Purchase Order Header)
- rstk__poline__c (PO Line)
- rstk__poloader__c (PO Loader API — use for create/change header and lines)
- rstk__poitem__c (Purchase Item Master)

Purchasing flow guidance:
- Validate rstk__pocntl__c and numbering controls exist before analyzing PO header/line creation issues.
- Use POLOADER for programmatic PO creation and changes rather than direct DML on pohdr/poline where possible.
- For item setup, follow peitem → icitem → poitem relationships before creating PO lines.
