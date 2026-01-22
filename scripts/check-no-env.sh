#!/usr/bin/env bash
set -euo pipefail

if git ls-files --error-unmatch '*.env' >/dev/null 2>&1; then
  echo "Tracked .env file detected. Remove it from git.";
  exit 1;
fi
