# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder: install ALL deps, compile TypeScript → dist/
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

# Install build tools required by some native npm modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy manifests first so Docker layer-caches the install step
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — production: only the compiled output + production deps
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy manifests and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Drop to non-root
USER appuser

EXPOSE 5000

# Healthcheck so Docker / Compose knows when the container is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "dist/index.js"]
