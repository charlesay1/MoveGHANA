#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ] && [ -f "$ROOT/services/api/secrets/database_url" ]; then
  DB_URL="$(cat "$ROOT/services/api/secrets/database_url")"
fi

if [ -z "$DB_URL" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

command -v psql >/dev/null 2>&1 || { echo "psql is required" >&2; exit 1; }

WALLET_ID=$(psql "$DB_URL" -tA -c "WITH upsert AS (INSERT INTO wallets (owner_type, owner_id, currency, status) VALUES ('platform','movegh','GHS','active') ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status RETURNING id) SELECT id FROM upsert UNION SELECT id FROM wallets WHERE owner_type='platform' AND owner_id='movegh' AND currency='GHS' LIMIT 1;")

if [ -z "$WALLET_ID" ]; then
  echo "Failed to create platform wallet" >&2
  exit 1
fi

psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('$WALLET_ID','escrow','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('$WALLET_ID','available','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('$WALLET_ID','pending','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"

psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO commission_rules (name, percent, fixed_fee, applies_to, active) VALUES ('default_ride',0.15,0.50,'ride',true) ON CONFLICT (name) DO UPDATE SET percent=EXCLUDED.percent, fixed_fee=EXCLUDED.fixed_fee, active=true;"

echo "payments seed complete"
