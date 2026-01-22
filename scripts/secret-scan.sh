#!/usr/bin/env bash
set -euo pipefail

if command -v rg >/dev/null 2>&1; then
  if rg -n "(BEGIN PRIVATE KEY|AWS_SECRET_ACCESS_KEY|GCP_PRIVATE_KEY|github_pat_|ghp_|xox[baprs]-)" \
    -g '!**/.env*' \
    -g '!**/node_modules/**' \
    -g '!**/dist/**' \
    -g '!**/.next/**' \
    .; then
    echo "Potential secrets found. Remove before committing."
    exit 1
  else
    status=$?
    if [ "$status" -eq 1 ]; then
      exit 0
    fi
    exit "$status"
  fi
else
  if grep -R "BEGIN PRIVATE KEY\|AWS_SECRET_ACCESS_KEY\|GCP_PRIVATE_KEY\|github_pat_\|ghp_\|xox[baprs]-" -n . \
    --exclude-dir node_modules --exclude-dir dist --exclude-dir .next; then
    echo "Potential secrets found. Remove before committing.";
    exit 1
  fi
fi
