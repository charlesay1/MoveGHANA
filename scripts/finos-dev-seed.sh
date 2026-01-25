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
ESCROW_ID="${ESCROW_OWNER_ID:-movegh_escrow}"
DISPUTES_ID="${DISPUTES_OWNER_ID:-movegh_disputes}"
OPS_ID="${OPS_OWNER_ID:-movegh_ops}"
INSURANCE_ID="${INSURANCE_OWNER_ID:-movegh_insurance}"

create_financial() {
  local owner_id="$1"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO financial_accounts (owner_type, owner_id, currency, status) VALUES ('platform','${owner_id}','GHS','active') ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status;"
}

create_wallet() {
  local owner_id="$1"
  psql "$DB_URL" -tA -c "WITH upsert AS (INSERT INTO wallets (owner_type, owner_id, currency, status) VALUES ('platform','${owner_id}','GHS','active') ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status RETURNING id) SELECT id FROM upsert UNION SELECT id FROM wallets WHERE owner_type='platform' AND owner_id='${owner_id}' AND currency='GHS' LIMIT 1;"
}

seed_wallet_accounts() {
  local wallet_id="$1"
  shift
  for acct in "$@"; do
    psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ('${wallet_id}','${acct}','GHS',0) ON CONFLICT (wallet_id, type, currency) DO NOTHING;"
  done
}

for owner in "$TREASURY_ID" "$REVENUE_ID" "$RESERVE_ID" "$ESCROW_ID" "$DISPUTES_ID" "$OPS_ID" "$INSURANCE_ID"; do
  create_financial "$owner"
  WALLET_ID=$(create_wallet "$owner")
  if [ -z "$WALLET_ID" ]; then
    echo "Failed to create wallet for ${owner}" >&2
    exit 1
  fi
  case "$owner" in
    "$TREASURY_ID") seed_wallet_accounts "$WALLET_ID" escrow available pending ;;
    "$ESCROW_ID") seed_wallet_accounts "$WALLET_ID" escrow ;;
    *) seed_wallet_accounts "$WALLET_ID" available ;;
  esac
  echo "seeded ${owner}"
 done

echo "finos seed complete"
