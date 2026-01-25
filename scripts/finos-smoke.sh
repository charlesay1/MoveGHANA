#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_URL="${API_URL:-http://localhost:4000}"
DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ] && [ -f "$ROOT/services/api/secrets/database_url" ]; then
  DB_URL="$(cat "$ROOT/services/api/secrets/database_url")"
fi

if [ -z "$DB_URL" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

command -v psql >/dev/null 2>&1 || { echo "psql is required" >&2; exit 1; }

"$ROOT/scripts/finos-dev-seed.sh" >/dev/null

QUOTE_RES=$(curl -sS -X POST "$API_URL/v1/finos/pricing/quote" \
  -H "Content-Type: application/json" \
  -d '{"city":"accra","distanceKm":12.5,"durationMin":25,"surgeMultiplier":1.2,"currency":"GHS"}')

echo "pricing_quote=$QUOTE_RES"

TXN_ID=$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)

psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
WITH rider_wallet AS (
  INSERT INTO wallets (owner_type, owner_id, currency, status)
  VALUES ('rider','finos_rider','GHS','active')
  ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status
  RETURNING id
), rider_account AS (
  INSERT INTO ledger_accounts (wallet_id, type, currency, balance)
  SELECT id, 'available', 'GHS', 50 FROM rider_wallet
  ON CONFLICT (wallet_id, type, currency) DO UPDATE SET balance = EXCLUDED.balance
  RETURNING id
), driver_wallet AS (
  INSERT INTO wallets (owner_type, owner_id, currency, status)
  VALUES ('driver','finos_driver','GHS','active')
  ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status
  RETURNING id
), driver_account AS (
  INSERT INTO ledger_accounts (wallet_id, type, currency, balance)
  SELECT id, 'available', 'GHS', 0 FROM driver_wallet
  ON CONFLICT (wallet_id, type, currency) DO UPDATE SET wallet_id = EXCLUDED.wallet_id
  RETURNING id
), txn AS (
  INSERT INTO transactions (id, type, status, idempotency_key, metadata)
  VALUES ('${TXN_ID}', 'payment', 'captured', 'finos-${TXN_ID}', '{"action":"finos_smoke"}')
  ON CONFLICT (idempotency_key) DO UPDATE SET status = EXCLUDED.status
  RETURNING id
)
UPDATE ledger_accounts SET balance = balance - 10 WHERE id IN (SELECT id FROM rider_account);
UPDATE ledger_accounts SET balance = balance + 10 WHERE id IN (SELECT id FROM driver_account);
INSERT INTO ledger_entries (account_id, txn_id, direction, amount, balance_after)
SELECT id, '${TXN_ID}', 'debit', 10, balance FROM ledger_accounts WHERE id IN (SELECT id FROM rider_account);
INSERT INTO ledger_entries (account_id, txn_id, direction, amount, balance_after)
SELECT id, '${TXN_ID}', 'credit', 10, balance FROM ledger_accounts WHERE id IN (SELECT id FROM driver_account);
SQL

echo "finos smoke ledger entries inserted"

"$ROOT/scripts/finos-invariants.sh"
