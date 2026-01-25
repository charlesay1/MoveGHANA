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

VIOLATIONS=$(psql "$DB_URL" -tA -c "SELECT COUNT(*) FROM (SELECT txn_id, SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END) AS net FROM ledger_entries WHERE txn_id IS NOT NULL GROUP BY txn_id HAVING SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END) <> 0) t;")

if [ "$VIOLATIONS" -ne 0 ]; then
  echo "Ledger invariants failed: ${VIOLATIONS} violations" >&2
  exit 1
fi

echo "Ledger invariants OK"
