# MoveGH Payments Architecture (Digital-Only)

## Core Principles
- No cash flows. All payments are digital.
- All funds flow through MoveGH escrow first.
- Commissions are auto-captured on every trip.
- Wallets are platform-controlled internal ledgers.

## Payment Flow (Happy Path)
1) Rider initiates payment (MoMo) → MoveGH creates a PaymentIntent.
2) Provider charges the rider → MoveGH captures funds into Platform Escrow.
3) MoveGH computes commission → auto-splits escrow into:
   - Platform revenue (commission)
   - Driver wallet (net)
4) Driver can withdraw → Payout is queued and settled by provider.

## Supported Rails (MoMo First)
- MTN MoMo
- Vodafone Cash
- AirtelTigo Money

Provider-specific details are hidden behind a common interface. All webhook callbacks are verified and processed exactly once.

## Entities
- Wallet: logical owner wallet (rider/driver/platform)
- LedgerAccount: wallet sub-accounts (available | pending | escrow)
- LedgerEntry: double-entry record (debit/credit) with balance_after
- Transaction: idempotent financial operation (payment/commission/payout/refund/adjustment)
- PaymentIntent: rider charge request and state machine
- CommissionRule: percentage + fixed fee rules
- Payout: driver withdrawal lifecycle
- TripCharge: logical linkage of trip to payment/commission
- AuditLog: immutable event record with payload hashes

## State Machines
### PaymentIntent
- created → authorized → captured → failed
- created → failed

### Payout
- queued → sent → settled
- queued → failed

## Idempotency & Safety
- Idempotency-Key is required on POST endpoints.
- Idempotency is enforced via transactions.idempotency_key.
- Webhook deliveries are processed exactly once.
- All ledger postings are performed inside a single DB transaction.

## Reconciliation & Audit
- Every financial operation produces:
  - Transactions row
  - Ledger entries (double-entry)
  - Audit log with payload hash
- Periodic reconciliation compares provider states to ledger balances.

## Security
- Provider secrets are validated at startup.
- Sensitive values are never logged.
- Phone numbers are redacted in logs.
- Webhook signatures are verified before processing.
- RBAC enforced for wallet and payout endpoints.

## Webhooks
Flow:
- Provider callback → verify signature → parse payload
- Build idempotency key → apply ledger update once
- Update PaymentIntent status
- Record audit log

## Escrow + Split Rules
- Rider funds are held in Platform Escrow.
- Commission rules are applied to gross charge.
- Driver receives net amount after commission.

