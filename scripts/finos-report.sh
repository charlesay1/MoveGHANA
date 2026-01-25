#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"

curl -sS "$API_URL/v1/ops/finos-report"
