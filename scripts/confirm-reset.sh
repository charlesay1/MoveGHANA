#!/usr/bin/env bash
set -euo pipefail

read -r -p "This will drop Docker volumes and erase DB data. Type 'movegh-reset' to continue: " reply
if [[ "$reply" != "movegh-reset" ]]; then
  echo "Aborted."
  exit 1
fi
