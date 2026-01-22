# Security Baseline

## API
- Helmet enabled
- CORS allowlist via `CORS_ORIGINS`
- Rate limiting on auth endpoints
- JWT secret required; production guard blocks weak/default secrets

## Repo hygiene
- `.env` files never committed
- URL hardcode scan via `pnpm check:urls`
- Secret scan in CI
- `.env` tracked file check via `pnpm check:no-env`

## Secrets handling
- Use hosting-provider secrets (never in git)
- Rotate secrets on schedule or incident
