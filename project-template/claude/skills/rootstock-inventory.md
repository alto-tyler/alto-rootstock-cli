# Rootstock Inventory — Item Masters and Inventory State Objects

## Item and Inventory Master Objects

- rstk__peitem__c (Engineering Item Master) — top of the item setup chain
- rstk__icitem__c (Inventory Item Master)
- rstk__soprod__c (Rootstock Product Master — for sales)
- rstk__poitem__c (Purchase Item Master — for purchasing)
- rstk__iclocitem__c (Inventory Item by Location)
- rstk__icitemlot__c (Inventory by Lot Number)
- rstk__icitemsrl__c (Inventory Item by Serial Number)

## Item Setup Relationship Chain

Follow this order when setting up item records:
```
rstk__peitem__c → rstk__icitem__c → rstk__soprod__c (for sales)
                                  → rstk__poitem__c (for purchasing)
```

Treat iclocitem, icitemlot, and icitemsrl as complementary views of inventory availability state — inspect them together when diagnosing inventory balance issues.

## Proactive Org Queries for Inventory Questions

ICLocItem (location-level balances):
```soql
SELECT Id, Name, rstk__iclocitem_item__c, rstk__iclocitem_loc__c, rstk__iclocitem_qtyonhand__c
FROM rstk__iclocitem__c LIMIT 10
```

Summarize what you found before answering inventory balance questions.

## Inventory Transfer

For inventory movements between locations, sites, divisions, or projects, use SYDATAT (rstk__sydatat__c) — not direct DML on iclocitem. Load rootstock-sydatat.md for SYDATAT transaction ID values and patterns.

## Inventory Troubleshooting

- Always inspect iclocitem, icitemlot, and icitemsrl together — they represent different facets of the same inventory position.
- Check that UOM and inventory location records exist before diagnosing balance discrepancies.
- For inventory-impacting transactions (receipts, issues, adjustments), use SYDATA (rstk__sydata__c) tx types. Load rootstock-sydata.md for SYDATA transaction type values.
