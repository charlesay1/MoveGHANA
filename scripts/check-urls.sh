#!/usr/bin/env bash
set -euo pipefail

if command -v rg >/dev/null 2>&1; then
  if rg -n "http://localhost|localhost:4000|127\.0\.0\.1" \
    -g '!**/.env*' \
    -g '!**/README.md' \
    -g '!**/docs/**' \
    -g '!**/node_modules/**' \
    -g '!**/.next/**' \
    -g '!**/dist/**' \
    .; then
    echo "Hardcoded localhost URL found. Use env vars instead."
    exit 1
  else
    status=$?
    if [ "$status" -eq 1 ]; then
      exit 0
    fi
    exit "$status"
  fi
else
  echo "rg not found; falling back to grep";
  if grep -R "http://localhost\|localhost:4000\|127.0.0.1" -n . \
    --exclude-dir node_modules --exclude-dir .next --exclude-dir dist --exclude README.md; then
    echo "Hardcoded localhost URL found. Use env vars instead.";
    exit 1;
  fi
fi
