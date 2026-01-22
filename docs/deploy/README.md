# moveGH Deployment (Staging → Production)

## Recommended stack (Option A)
- API: Fly.io (containerized)
- DB: Managed Postgres (Fly Postgres / Neon)
- Web apps (Business/Admin): Vercel

## Environments
- Staging: preview and QA
- Production: live traffic

## Domains
- `api.movegh.app`
- `admin.movegh.app`
- `business.movegh.app`

## Environment variables
- Set via platform secrets (never commit)
- API: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `CORS_ORIGINS`
- Web: `NEXT_PUBLIC_API_URL`

## Rollback strategy
- Tag releases (`v*`), redeploy previous tag
- Keep last known good container image

## Database migrations
- Apply via CI or manual run before production deploy

## First deployment checklist
- [ ] Create staging DB and API secrets
- [ ] Deploy API container to Fly.io
- [ ] Configure Vercel projects (admin/business)
- [ ] Point DNS records
- [ ] Smoke test /health and auth flow
