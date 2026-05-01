#!/bin/sh
set -e

# Build DATABASE_URL from individual POSTGRES_* env vars so the password can
# contain ':', '@', '/', '?', '#' and other URL-meaningful characters without
# breaking Prisma's connection-string parser.
DATABASE_URL=$(node -e '
const enc = encodeURIComponent;
const user = enc(process.env.POSTGRES_USER || "safehouse");
const pass = enc(process.env.POSTGRES_PASSWORD || "");
const host = process.env.POSTGRES_HOST || "postgres";
const port = process.env.POSTGRES_PORT || "5432";
const db   = enc(process.env.POSTGRES_DB || "safehouse");
console.log(`postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`);
')
export DATABASE_URL

/app/node_modules/.bin/prisma migrate deploy
exec node dist/index.js
