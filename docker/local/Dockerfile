# Multi-stage Dockerfile for local deployment
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/local-api/package.json ./apps/local-api/
COPY apps/local-web/package.json ./apps/local-web/
COPY packages/*/package.json ./packages/
COPY modules/*/package.json ./modules/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build applications
RUN bun run build

# Production stage for API
FROM oven/bun:1-slim AS api

WORKDIR /app

# Copy built API
COPY --from=builder /app/apps/local-api/dist ./
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/node_modules ./node_modules

# Install production dependencies only
RUN bun install --production

EXPOSE 3001

CMD ["bun", "run", "index.js"]

# Production stage for Web
FROM nginx:alpine AS web

# Copy built web app
COPY --from=builder /app/apps/local-web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/local/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]