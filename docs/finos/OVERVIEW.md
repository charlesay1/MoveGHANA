# MoveGH Financial OS (FOS)

## Purpose
The Financial OS (FOS) is the platform-controlled money brain of MoveGH. It governs all money movement with a double-entry ledger as the single source of truth and enforces escrow, commission capture, payouts, and governance rules across all rails.

## Core Invariants
- No cash flows
- All payments flow through MoveGH escrow
- Double-entry ledger is the source of truth
- Idempotency on all money-changing actions
- Immutable audit events for every state change
- Verified and deduped webhooks

## Domain Boundaries
- ledger: immutable financial entries
- wallets: financial identities and accounts
- pricing: fares, fees, taxes, and commission
- escrow: trip holds and releases
- payouts: driver withdrawals
- settlement: provider reconciliation
- treasury: liquidity and reserves
- risk: fraud and AML hooks
- compliance: reporting and controls
- reporting: operational summaries
