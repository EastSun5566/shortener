# Base stage for server dependencies
FROM node:22-alpine AS server-base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy server package files
COPY server/package.json server/pnpm-lock.yaml ./server/

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile --filter server

# Copy server source
COPY server ./server

# Development stage for server
FROM server-base AS development

# Expose port
EXPOSE 8080

# Set development environment
ENV NODE_ENV=development

# In development, source is mounted as volume
# This is just a fallback
CMD ["sh", "-c", "cd /app/server && pnpm run dev"]

# Build stage for server (production compilation)
FROM server-base AS server-builder

# Build server
RUN pnpm --filter server build

# Build stage for web
FROM node:22-alpine AS web-builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy web package files
COPY web/package.json web/pnpm-lock.yaml ./web/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter web

# Copy web source
COPY web ./web

# Build web (production build)
RUN pnpm --filter web build

# Production stage
FROM node:22-alpine AS production

# Install pnpm and curl for health checks
RUN corepack enable && corepack prepare pnpm@9 --activate && \
  apk add --no-cache curl

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy server package.json
COPY server/package.json ./server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --filter server --prod

# Copy built server from builder
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/src/drizzle ./server/src/drizzle

# Copy built web from builder
COPY --from=web-builder /app/web/dist ./web/dist

# Expose server port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start server
CMD ["pnpm", "run", "server:start"]
