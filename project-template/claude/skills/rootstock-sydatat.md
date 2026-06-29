# Rootstock SYDATAT — Inventory Transfer Transaction Object

## SYDATAT Processing Object

rstk__sydatat__c is the transaction object used to move inventory between locations, sites, and divisions. It is a distinct object from SYDATA.

- Use SYDATAT specifically for inventory transfer movements (location-to-location, site-to-site, division-to-division, project-to-project).
- Do not use SYDATA for inventory transfers — SYDATAT is the correct object for this purpose.
- When SYDATAT runs in async/background mode, SYDATA can process those queued transfer transactions.
- Prefer background/async processing fields for bulk transfer operations to reduce governor-limit pressure.

Proactive org query for SYDATAT questions:
```soql
SELECT Id, rstk__sydatat_txnid__c, rstk__sydatat_process__c, rstk__sydatat_message__c
FROM rstk__sydatat__c
ORDER BY CreatedDate DESC LIMIT 5
```
Summarize what you found (or that no records exist) before answering.

## SYDATAT Transaction ID Values

Use exact Transaction ID values (case, no spaces) when setting rstk__sydatat_txnid__c. Do not invent or normalize names.

Canonical list source: docs/rootstock-sydatat-txn-id.csv

Valid values:
- INVDIVDIV (division to division transfer)
- INVSITESITE (site to site transfer)
- INVPROJPROJ (project to project transfer)
- INVLOCLOC (location to location transfer)

If a user provides a SYDATAT transaction ID list for their org, treat that org-specific list as authoritative.

## Relationship to SYDATA

SYDATAT and SYDATA are two separate processing objects:
- SYDATAT = initiates inventory transfer movements between locations/sites/divisions/projects
- SYDATA = background processor that can execute async SYDATAT queued transactions (among other tx types)

For questions about PO receipts, labor bookings, WO closure, or async queue processing, load rootstock-sydata.md instead.
