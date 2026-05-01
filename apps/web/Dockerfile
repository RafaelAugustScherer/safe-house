# syntax=docker/dockerfile:1.7

# ---- build stage ----
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --no-audit --no-fund --ignore-scripts

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @safehouse/shared
RUN npm run build -w @safehouse/web

# ---- runtime stage: caddy serves static + reverse-proxies /socket.io + /api ----
FROM caddy:2-alpine

COPY --from=build /app/apps/web/build /srv/web
COPY apps/web/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443
