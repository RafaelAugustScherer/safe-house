# syntax=docker/dockerfile:1.7

# ---- build stage ----
FROM node:24-alpine AS build

# Prisma's query engine requires openssl on Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

# Install deps using just the manifests so layer caching survives source edits.
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --no-audit --no-fund --ignore-scripts

# Copy sources and build the shared package + api.
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @safehouse/shared
# Generate Prisma Client first so the api's TS build sees its types.
RUN npm run prisma:generate -w @safehouse/api
RUN npm run build -w @safehouse/api

# Drop dev deps to slim the runtime image.
RUN npm prune --omit=dev --ignore-scripts

# ---- runtime stage ----
FROM node:24-alpine AS runtime

RUN apk add --no-cache openssl
ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 4000

# Apply pending DB migrations on boot, then start the server.
# Invoke prisma via the local bin to avoid npx fetching a newer Prisma 7
# from the registry (which has incompatible schema requirements).
CMD ["sh", "-c", "/app/node_modules/.bin/prisma migrate deploy && node dist/index.js"]
