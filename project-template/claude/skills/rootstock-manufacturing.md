# Rootstock Manufacturing — Work Orders, Components, and Cost Transactions

## Manufacturing Objects

- rstk__wocst__c (Work Order)
- rstk__woorddmd__c (Work Order Component)
- rstk__woorddmdcst__c (Work Order Component Detail)
- rstk__sytxncst__c (Rootstock Cost Transaction)

## Manufacturing Flow Guidance

- Work order flows must validate rstk__wocst__c before creating dependent WO component records.
- WO component detail and cost transaction troubleshooting should verify component quantities, issue status, and costing fields together.
- Some Rootstock flows require manufacturing user records (rstk__syusr__c) tied to the executing user context — confirm this when WO flows fail unexpectedly.
- Cost Accounting Control (rstk__csacctcntl__c) must be configured before cost transaction processing.

## Required Setup for Manufacturing Tests

Before creating manufacturing test data, confirm these baseline records exist:
1. rstk__syconfig__c (system config)
2. Company, division, and rstk__syusr__c (manufacturing user linked to the running user)
3. Site and division main site assignment
4. UOM and default records
5. Item setup: rstk__peitem__c → rstk__icitem__c → relevant product masters
6. rstk__csacctcntl__c (Cost Accounting Control) for cost transaction flows

## Debugging Manufacturing Issues

When diagnosing WO or cost transaction failures:
1. Confirm rstk__syusr__c exists for the running user context.
2. Confirm component quantities, issue status, and costing fields are set correctly.
3. Validate that all required upstream records (wocst → woorddmd → woorddmdcst) exist in the correct order.
4. Inspect managed-package trigger side effects before changing business logic.
