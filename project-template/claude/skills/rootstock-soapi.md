# Rootstock SOAPI — Sales Order API Object and Sales Order Flows

## SOAPI Processing Object

rstk__soapi__c is the Sales Order API object. Use it for:
- Creating sales orders (Add Header, Add Both)
- Creating sales order lines (Add Line)
- Changing existing order headers/lines (Change Header, Change Line, Change Both)
- Deleting headers/lines (Delete Header, Delete Line, Delete Both)

If rstk Application Settings has soapi_bulksoapis = true, bulk SOAPI processing can group related rows by Upload Group.
- For grouped bulk creation, the header row must be processed before its related line rows.
- Prefer background/async processing fields for high-volume loads.

Proactive org query for SOAPI questions:
```soql
SELECT Id, rstk__soapi_mode__c, rstk__soapi_process__c, rstk__soapi_message__c
FROM rstk__soapi__c
ORDER BY CreatedDate DESC LIMIT 5
```
Summarize what you found (or that no records exist) before answering.

## SOAPI Mode Values

Use exact mode values (case, spacing) when setting rstk__soapi_mode__c. Do not invent or normalize names.

Canonical list source: docs/rootstock-soapi-modes.csv

Valid values:
- Add Header
- Add Both
- Add Line
- Change Header
- Change Both
- Change Line
- Delete Line
- Delete Both
- Delete Header

Header rows must be inserted before their related line rows when using Upload Group.

## Sales Order Object Chain

When Rootstock sales-order records are created directly or indirectly, use this dependency order:

1. rstk__sohdr__c (Sales Order Header)
2. rstk__soline__c (Sales Order Line)
3. rstk__soorddmd__c (Line Demand) — when demand/issue logic is involved
4. rstk__soship__c (Shipment) — when fulfillment/ship logic is involved
5. rstk__sohdrpay__c (Payment/Prepayment) — when payment logic is involved

Known constraints and gotchas:
- rstk__soorddmd__c inserts must set rstk__soorddmd_qtyper__c > 0.
- rstk__soship__c.rstk__soship_shipper__c is a required DOUBLE (Shipper Number), not a lookup.
- Certain Rootstock computed fields are read-only in tests; set writable upstream fields instead.
- Duplicate prevention should consider existing sohdr/soline combinations before adding new SOAPI-driven records.
- Sales control configuration (rstk__socntl__c) must exist before SOAPI/sales-order creation.
