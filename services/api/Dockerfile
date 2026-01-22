FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY services/api/package.json services/api/package.json
COPY packages/theme/package.json packages/theme/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --filter movegh-api... --frozen-lockfile || pnpm install --filter movegh-api...

FROM base AS build
COPY . .
RUN pnpm --filter movegh-api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/api/dist ./dist
COPY --from=build /app/services/api/package.json ./package.json
RUN npm pkg set type=commonjs >/dev/null 2>&1 || true
EXPOSE 4000
CMD ["node", "dist/main.js"]
