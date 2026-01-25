#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_URL="${API_URL:-http://localhost:4000}"

JWT_SECRET="${JWT_SECRET:-}"
if [ -z "$JWT_SECRET" ] && [ -f "$ROOT/services/api/secrets/jwt_secret" ]; then
  JWT_SECRET="$(cat "$ROOT/services/api/secrets/jwt_secret")"
fi

if [ -z "$JWT_SECRET" ]; then
  echo "JWT_SECRET is required (set env or services/api/secrets/jwt_secret)" >&2
  exit 1
fi

command -v node >/dev/null 2>&1 || { echo "node is required" >&2; exit 1; }

RIDER_ID="${RIDER_ID:-rider_smoke}"
DRIVER_ID="${DRIVER_ID:-driver_smoke}"
PHONE_NUMBER="${PHONE_NUMBER:-233240000000}"
TRIP_ID="${TRIP_ID:-trip_smoke}"
AMOUNT="${AMOUNT:-25.50}"
TREASURY_ID="${TREASURY_OWNER_ID:-movegh_treasury}"

DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -f "$ROOT/services/api/secrets/database_url" ]; then
  DB_URL="$(cat "$ROOT/services/api/secrets/database_url")"
fi

if [ -z "$DB_URL" ]; then
  echo "DATABASE_URL is required to seed rider balance" >&2
  exit 1
fi

command -v psql >/dev/null 2>&1 || { echo "psql is required" >&2; exit 1; }

RIDER_TOKEN=$(node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:'$RIDER_ID', role:'rider'}, '$JWT_SECRET', {expiresIn:'1h'}));")
DRIVER_TOKEN=$(node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:'$DRIVER_ID', role:'driver'}, '$JWT_SECRET', {expiresIn:'1h'}));")

IDEMP1=$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)
IDEMP2=$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)
IDEMP3=$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)

TOPUP_TXN=$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)

psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
WITH treasury_wallet AS (
  INSERT INTO wallets (owner_type, owner_id, currency, status)
  VALUES ('platform','${TREASURY_ID}','GHS','active')
  ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status
  RETURNING id
), treasury_pending AS (
  INSERT INTO ledger_accounts (wallet_id, type, currency, balance)
  SELECT id, 'pending', 'GHS', 0 FROM treasury_wallet
  ON CONFLICT (wallet_id, type, currency) DO UPDATE SET wallet_id = EXCLUDED.wallet_id
  RETURNING id
), rider_wallet AS (
  INSERT INTO wallets (owner_type, owner_id, currency, status)
  VALUES ('rider','${RIDER_ID}','GHS','active')
  ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status
  RETURNING id
), rider_available AS (
  INSERT INTO ledger_accounts (wallet_id, type, currency, balance)
  SELECT id, 'available', 'GHS', 0 FROM rider_wallet
  ON CONFLICT (wallet_id, type, currency) DO UPDATE SET wallet_id = EXCLUDED.wallet_id
  RETURNING id
), txn AS (
  INSERT INTO transactions (id, type, status, idempotency_key, metadata)
  VALUES ('${TOPUP_TXN}', 'adjustment', 'posted', 'seed-${TOPUP_TXN}', '{"action":"seed_rider_balance"}')
  ON CONFLICT (idempotency_key) DO UPDATE SET status = EXCLUDED.status
  RETURNING id
)
UPDATE ledger_accounts SET balance = balance + ${AMOUNT} WHERE id IN (SELECT id FROM rider_available);

UPDATE ledger_accounts SET balance = balance - ${AMOUNT} WHERE id IN (SELECT id FROM treasury_pending);

INSERT INTO ledger_entries (account_id, txn_id, direction, amount, balance_after)
SELECT id, '${TOPUP_TXN}', 'credit', ${AMOUNT}, balance FROM ledger_accounts WHERE id IN (SELECT id FROM rider_available);

INSERT INTO ledger_entries (account_id, txn_id, direction, amount, balance_after)
SELECT id, '${TOPUP_TXN}', 'debit', ${AMOUNT}, balance FROM ledger_accounts WHERE id IN (SELECT id FROM treasury_pending);
SQL

INTENT_RES=$(curl -sS -X POST "$API_URL/v1/payments/intents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RIDER_TOKEN" \
  -H "Idempotency-Key: $IDEMP1" \
  -d "{\"tripId\":\"$TRIP_ID\",\"riderId\":\"$RIDER_ID\",\"amount\":$AMOUNT,\"currency\":\"GHS\",\"provider\":\"mock\",\"phoneNumber\":\"$PHONE_NUMBER\"}")

INTENT_ID=$(python3 - <<PY
import json,sys
res=json.loads('''$INTENT_RES''')
print(res.get('intentId',''))
PY
)

if [ -z "$INTENT_ID" ]; then
  echo "Failed to create intent: $INTENT_RES" >&2
  exit 1
fi

CONFIRM_RES=$(curl -sS -X POST "$API_URL/v1/payments/intents/$INTENT_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RIDER_TOKEN" \
  -H "Idempotency-Key: $IDEMP2" \
  -d "{\"phoneNumber\":\"$PHONE_NUMBER\",\"driverId\":\"$DRIVER_ID\"}")

echo "confirm_response=$CONFIRM_RES"

WALLET_RIDER=$(curl -sS -X GET "$API_URL/v1/wallets/me" -H "Authorization: Bearer $RIDER_TOKEN")
WALLET_DRIVER=$(curl -sS -X GET "$API_URL/v1/wallets/me" -H "Authorization: Bearer $DRIVER_TOKEN")

echo "rider_wallet=$WALLET_RIDER"
echo "driver_wallet=$WALLET_DRIVER"

PAYOUT_RES=$(curl -sS -X POST "$API_URL/v1/payouts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Idempotency-Key: $IDEMP3" \
  -d "{\"amount\":5.00,\"provider\":\"mock\",\"destinationPhone\":\"$PHONE_NUMBER\"}")

echo "payout_response=$PAYOUT_RES"

echo "payments smoke complete"
