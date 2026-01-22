# Environment Strategy (dev / staging / prod)

## Root templates
- `.env.example`
- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`

## Per app/service templates
- `services/api/.env.example`
- `services/db/.env.example`
- `apps/rider/.env.example`
- `apps/driver/.env.example`
- `apps/business/.env.example`
- `apps/admin/.env.example`
- `infra/compose/.env.example` (Docker compose only)

## Required variables
### API
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `CORS_ORIGINS` (comma-separated)

### DB
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Rider/Driver (Expo)
- `EXPO_PUBLIC_API_URL`

### Business/Admin (Next.js)
- `NEXT_PUBLIC_API_URL`

## Rules
- No hardcoded URLs in code. Use env vars.
- Never commit real `.env` files.
- `pnpm check:env` expects `.env.<target>` (e.g., `.env.development`) or `.env.local`.
