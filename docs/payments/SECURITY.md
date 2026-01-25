# MoveGH Payments Security

## Data Protection
- No secrets in logs
- Phone numbers stored as hashes where required
- Audit logs store payload hashes only
- TLS required in live mode

## Access Control
- All payment routes require JWT
- Webhook verification required in live mode
- Idempotency keys required for POST routes

## Secrets Management
- Provider secrets stored in services/api/secrets (dev) or secret manager (staging/prod)
- Secrets are validated at startup in live mode

## Ledger Integrity
- Double-entry ledger enforced
- Negative balances blocked except pending
- All money movement recorded in transactions and ledger_entries

## Compliance
- Audit logs for every payment intent, capture, payout
- Webhook dedupe via idempotency keys
