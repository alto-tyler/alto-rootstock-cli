# Rootstock SYDATA — Inventory and Cost Transaction Processor

## SYDATA Processing Object

rstk__sydata__c is the background processor for inventory-balance-impacting and cost-impacting activity. Use it for:
- PO receipts
- Labor bookings
- WO closure
- Processing async transactions queued by SOAPI, POLOADER, SYDATAT, and related transaction objects

Prefer background/async processing fields when batching transactions to reduce Salesforce governor-limit pressure.

Proactive org query for SYDATA questions:
```soql
SELECT Id, rstk__sydata_txntype__c, rstk__sydata_process__c, rstk__sydata_message__c
FROM rstk__sydata__c
ORDER BY CreatedDate DESC LIMIT 5
```
Summarize what you found (or that no records exist) before answering.

## SYDATA Transaction Types

Use exact transaction type values (case, spacing, punctuation) when setting rstk__sydata_txntype__c. Do not invent or normalize names.

Canonical list source: docs/rootstock-sydata-txn-types.csv

Important values to recognize and use exactly:
- Loc Add
- Loc Adjust
- Loc Scrap
- Process Async SOAPIs
- Process BULK Async SOAPIs
- Process Async POLOADERs
- Sales Order Pick-Pack-Ship
- PO Receipt
- Labor Booking
- WO Close

If a user provides a SYDATA transaction type list for their org, treat that org-specific list as authoritative over assumptions.

## Relationship to Other Transaction Objects

- SYDATA acts as the async processor for transactions queued by SOAPI, POLOADER, and SYDATAT.
- SYDATA and SYDATAT are separate objects with different purposes:
  - SYDATA = inventory/cost transaction processor (receipts, bookings, closures, async queue processing)
  - SYDATAT = inventory transfer transaction object (moving inventory between locations/sites/divisions)
- Do not conflate SYDATA and SYDATAT. Load rootstock-sydatat.md if the question involves inventory transfers between locations, sites, or divisions.
