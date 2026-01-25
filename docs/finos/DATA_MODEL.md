# Financial OS Data Model

## Core Tables
- financial_accounts
- ledger_entries
- payment_intents
- escrow_holds
- payouts
- settlements
- settlement_batches
- reconciliation_reports
- disputes
- refunds

## Ownership Types
- platform
- rider
- driver
- merchant
- ops

## Key Relationships
- payment_intents -> escrow_holds
- ledger_entries -> financial_accounts
- settlements -> reconciliation_reports
- payouts -> settlement_batches
- disputes -> payment_intents
- refunds -> payment_intents
