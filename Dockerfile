# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------
# Base image
# ---------------------------------------------------------
FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /app

RUN corepack enable


# ---------------------------------------------------------
# Build stage
# ---------------------------------------------------------
FROM base AS build

# Required for Prisma, certificates, and native Node dependencies.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
        python3 \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better Docker layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod=false

# Copy build configuration.
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY prisma.config.ts ./

# Copy Prisma schema and migrations.
COPY prisma ./prisma

# Copy application source.
COPY src ./src

# The prebuild script runs:
# pnpm clean && pnpm prisma:generate
#
# Prisma config requires DATABASE_URL while generating the client.
# This dummy URL is used only during image compilation.
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/build?schema=public" \
    pnpm build

# Keep only production dependencies.
RUN pnpm prune --prod


# ---------------------------------------------------------
# Production runtime stage
# ---------------------------------------------------------
FROM node:24-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV="production"
ENV PORT="3000"

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/metrics').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

STOPSIGNAL SIGTERM

CMD ["node", "dist/main.js"]