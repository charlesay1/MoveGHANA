.PHONY: dev api db rider driver business admin

dev:
	pnpm dev

api:
	pnpm --filter movegh-api dev

db:
	docker compose -f services/db/docker-compose.yml up -d

rider:
	pnpm --filter movegh-rider dev

driver:
	pnpm --filter movegh-driver dev

business:
	pnpm --filter movegh-business dev

admin:
	pnpm --filter movegh-admin dev
