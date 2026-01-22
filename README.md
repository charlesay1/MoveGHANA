# moveGH

One App. Every Route. Across Ghana.

## Products
- Rider app (Expo iOS/Android/iPad): on-demand rides, deliveries, landmark pickups
- Driver app (Expo iOS/Android): driver onboarding, trip workflow
- Business web (Next.js): business accounts, delivery management
- Admin web (Next.js): operations and safety oversight

## Monorepo Structure
- apps/rider
- apps/driver
- apps/business
- apps/admin
- packages/ui
- packages/theme
- packages/types
- packages/api-client
- packages/utils
- services/api
- services/db

## Ports (Single Source of Truth)
- API: 4000
- Business web: 3000
- Admin web: 3001
- Expo: default Expo ports (no Vite)

## Setup
1) Install pnpm (v9+)
2) Install dependencies:

```bash
pnpm install
```

## Run Commands
### Database (Postgres)
```bash
docker compose -f services/db/docker-compose.yml up -d
```

### Backend API (NestJS)
```bash
pnpm --filter movegh-api dev
```

### Rider App (Expo)
```bash
pnpm --filter movegh-rider dev
# Android
pnpm --filter movegh-rider android
# iOS
pnpm --filter movegh-rider ios
```

### Driver App (Expo)
```bash
pnpm --filter movegh-driver dev
```

### Business Web (Next.js)
```bash
pnpm --filter movegh-business dev
```

### Admin Web (Next.js)
```bash
pnpm --filter movegh-admin dev
```

## Run moveGH locally (DB + API + Rider)
### Database (Postgres)
```bash
cd services/db
docker compose up -d
```

### Backend API (NestJS)
```bash
pnpm --filter movegh-api dev
```

### Rider App (Expo)
```bash
pnpm --filter movegh-rider dev
pnpm --filter movegh-rider android
pnpm --filter movegh-rider ios
```

### Environment variables
- Root env: put shared values in `.env` (copy from `.env.example`).
- Rider app: put app-specific values in `apps/rider/.env` (copy from `apps/rider/.env.example`).
- `EXPO_PUBLIC_API_URL=http://<your-ip>:4000`
- API: put server-specific values in `services/api/.env` (copy from `services/api/.env.example`).
  - `DATABASE_URL=postgres://movegh:movegh@localhost:5432/movegh`
  - `JWT_SECRET=change-me`

### Troubleshooting
- Docker not running: start Docker Desktop and retry `docker compose up -d`.
- Port already in use: stop the process or change ports in `.env`.
- Expo device not found: open Expo DevTools and ensure a simulator/device is connected.
- API URL not reachable from device: use your machine IP instead of `localhost` in `EXPO_PUBLIC_API_URL`.

Smoke test checklist:
- Welcome → Phone → OTP (use server-logged OTP) → Profile → Location → Home
- Restart app → remains logged in (token → /users/me → routes to Profile/Location/Home)

## Environment
- Root .env.example for shared defaults
- services/api/.env.example for API-specific settings

## Testing
- Unit tests: `pnpm --filter @movegh/utils test`
- Rider auth reducer: `pnpm --filter movegh-rider test`
- API e2e tests: `pnpm --filter movegh-api test`

## Troubleshooting
- If Expo cannot find the app entry, ensure `apps/rider/index.js` and `apps/driver/index.js` exist.
- If API port conflicts, check `API_PORT` in `.env`.
- If Docker is not running, start Docker Desktop first.
