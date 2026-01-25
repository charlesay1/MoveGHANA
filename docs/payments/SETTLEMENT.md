# MoveGH Payments Settlement

## Goals
- Reconcile provider balances against ledger escrow
- Detect drift and raise alerts
- Batch payouts and track settlement state

## Data Model
- settlements
- settlement_batches
- reconciliation_reports

## Reconciliation Flow
1. Compute ledger escrow total for treasury wallet
2. Compare to provider reported balance
3. Record drift and status
4. Emit reconciliation report

## Status Values
- pending: provider total not available
- matched: no drift
- mismatch: drift detected

## Ops Endpoints
- GET /v1/ops/settlement-status
- GET /v1/ops/payments-status
