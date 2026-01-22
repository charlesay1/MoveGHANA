# moveGH Ports (Source of Truth)

Defaults (change only if necessary):
- postgres: 5432
- api: 4000
- business: 3000
- admin: 3001

If a port changes, update:
- `.env*.example` files
- `infra/compose/docker-compose.yml`
- app dev scripts (if explicit)
- documentation in `/docs/ops/*`
