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

TREASURY_ID="${TREASURY_OWNER_ID:-movegh_treasury}"
REVENUE_ID="${REVENUE_OWNER_ID:-movegh_revenue}"
RESERVE_ID="${RESERVE_OWNER_ID:-movegh_reserve}"
INSURANCE_ID="${INSURANCE_OWNER_ID:-movegh_insurance}"
REGHOLD_ID="${REGULATORY_HOLD_OWNER_ID:-movegh_reg_hold}"
OPS_ID="${OPS_OWNER_ID:-movegh_ops}"

create_wallet() {
  local owner_id="$1"
  psql "$DB_URL" -tA -c "WITH upsert AS (INSERT INTO wallets (owner_type, owner_id, currency, status) VALUES ('platform','${owner_id}','GHS','active') ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status RETURNING id) SELECT id FROM upsert UNION SELECT id FROM wallets WHERE owner_type='platform' AND owner_id='${owner_id}' AND currency='GHS' LIMIT 1;"
}

TREASURY_WALLET=$(create_wallet "$TREASURY_ID")
REVENUE_WALLET=$(create_wallet "$REVENUE_ID")
RESERVE_WALLET=$(create_wallet "$RESERVE_ID")
INSURANCE_WALLET=$(create_wallet "$INSURANCE_ID")
REGHOLD_WALLET=$(create_wallet "$REGHOLD_ID")
OPS_WALLET=$(create_wallet "$OPS_ID")

if [ -z "$TREASURY_WALLET" ]; then
  echo "Failed to create treasury wallet" >&2
  exit 1
fi

psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('$TREASURY_WALLET','escrow','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('$TREASURY_WALLET','available','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"
psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('$TREASURY_WALLET','pending','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"

for wallet in "$REVENUE_WALLET" "$RESERVE_WALLET" "$INSURANCE_WALLET" "$REGHOLD_WALLET" "$OPS_WALLET"; do
  if [ -n "$wallet" ]; then
    psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('$wallet','available','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"
  fi
done

psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO commission_rules (name, percent, fixed_fee, applies_to, active) VALUES ('default_ride',0.15,0.50,'ride',true) ON CONFLICT (name) DO UPDATE SET percent=EXCLUDED.percent, fixed_fee=EXCLUDED.fixed_fee, active=true;"

echo "payments seed complete"
