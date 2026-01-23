# syntax=docker/dockerfile:1.6
FROM node:20-bookworm AS base
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/api/package.json services/api/package.json
COPY packages/theme/package.json packages/theme/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --frozen-lockfile --filter movegh-api...

FROM base AS build
COPY . .
RUN pnpm --filter movegh-api build

FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/api/package.json services/api/package.json
COPY packages/theme/package.json packages/theme/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --frozen-lockfile --prod --filter movegh-api...

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/services/api/dist ./dist
COPY --from=build /app/services/api/package.json ./package.json
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/packages/utils ./packages/utils
COPY --from=build /app/packages/theme ./packages/theme
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=6 CMD ["/nodejs/bin/node","-e","require('http').get('http://127.0.0.1:4000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
CMD ["dist/main.js"]
