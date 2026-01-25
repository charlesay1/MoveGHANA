# moveGH Operations (Prod)

## Environment lifecycle
- Provision: ./infra/bootstrap.sh <env>
- Deploy: ./deploy.sh <env>
- Observe: CloudWatch + alerts
- Recover: restore + redeploy

## Payments Local Validation
1) Start DB
   - docker compose up -d postgres
2) Start API (dev)
   - pnpm --filter movegh-api dev
3) Seed payments data
   - ./scripts/payments-dev-seed.sh
4) Run smoke test (mock provider)
   - ./scripts/payments-smoke.sh

Expected:
- payment_intent.status=captured
- ledger entries created for escrow + commission + driver wallet
- payout queued and driver balance reduced
