# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (devDeps needed for nest build)
RUN npm ci

# Copy source code
COPY . .

# Build: runs `prisma generate && nest build` → outputs to /app/dist
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

# Install OpenSSL for Prisma client
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production deps only + keep prisma CLI for migrate deploy
RUN npm ci --omit=dev

# ✅ Copy the compiled dist from the builder stage — this is the key fix
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
