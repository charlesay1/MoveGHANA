# moveGH Deployment Blueprint

## Infrastructure overview
- API: containerized NestJS service
- DB: managed Postgres
- Web apps: Next.js (Business/Admin)
- Mobile apps: Expo EAS or store builds (not hosted here)

## Environments
- Staging: preview environment for QA and demos
- Production: live customer traffic

## Recommended hosting (pick one)
**Fly.io for the API**
- Simple container deploys, low operational overhead, good for small teams.
- Easy secrets management and region scaling.

**Managed Postgres**
- Use Fly Postgres, Neon, or AWS RDS (one managed provider per environment).

**Web apps**
- Host Business/Admin on Vercel (simple Next.js deployment with previews).

## Secrets management
- Store secrets in platform-managed secrets (Fly secrets / Vercel env vars).
- Never commit `.env` files. Use `.env.*.example` templates only.

## Domain routing
- `api.movegh.app` → API service
- `admin.movegh.app` → Admin web
- `business.movegh.app` → Business web

## First deployment checklist
- [ ] Create staging and production Postgres databases
- [ ] Configure `DATABASE_URL`, `JWT_SECRET`, `PORT` in API environment
- [ ] Deploy API container to Fly.io
- [ ] Configure Vercel projects for admin/business and set `NEXT_PUBLIC_API_URL`
- [ ] Point DNS records to hosting providers
- [ ] Smoke test /health and login flow
