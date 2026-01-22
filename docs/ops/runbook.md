# moveGH Runbook

## First time setup
- Install pnpm (v9+)
- Copy env templates to `.env` files
- `pnpm install`
- For Docker stack: `cp infra/compose/.env.example infra/compose/.env`

## Daily dev
- `pnpm dev:stack` (db + api + rider)
- Optional docker: `pnpm dev:stack:docker` (db + api in Docker)
- API in docker only: `pnpm dev:api:docker`
- Validate envs: `pnpm check:env`
- Enforce URL policy: `pnpm check:urls`
- Validate ports: `pnpm check:ports`

## Common issues
- Docker not running → start Docker Desktop
- Port in use → change port in env and update docs
- API unreachable on device → use machine IP in `EXPO_PUBLIC_API_URL`

## Reset safely
- `pnpm dev:reset` and type `RESET` when prompted
