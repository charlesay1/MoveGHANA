# MoveGH Payments Production Readiness

## Environments
- dev: mock provider only
- staging: live provider mode with sandbox endpoints
- prod: live provider mode with production endpoints

## Required Configuration
- APP_ENV: dev | staging | prod
- PAYMENTS_PROVIDER_MODE: mock | live
- PAYMENTS_PROVIDER: mtn | vodafone | airteltigo
- PAYMENTS_PUBLIC_URL: https://public-api-domain
- PAYMENTS_WEBHOOK_SECRET: required in live mode
- Provider secrets JSON under services/api/secrets

## Provider Mode Rules
- dev must use mock
- staging/prod must use live
- live mode requires HTTPS public URL
- live mode requires non-placeholder secrets
- idempotency keys required for all POST payment endpoints

## Deployment Checklist
1. Load secrets from Secrets Manager or secure volume
2. Configure HTTPS and webhook endpoints
3. Validate provider connectivity
4. Run migrations
5. Validate ops endpoints
6. Enable monitoring dashboards

## Production Guardrails
- No cash paths
- All funds settle through MoveGH escrow
- Commission auto-captured to revenue wallet
- Payouts only through platform-controlled wallet

## Operational Commands
- seed wallets: ./scripts/payments-dev-seed.sh
- smoke test (mock): ./scripts/payments-smoke.sh
