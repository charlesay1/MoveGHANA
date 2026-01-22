#!/usr/bin/env bash
set -euo pipefail

read -r -p "This will drop Docker volumes and erase DB data. Type 'RESET' to continue: " reply
if [[ "$reply" != "RESET" ]]; then
  echo "Aborted."
  exit 1
fi
