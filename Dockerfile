# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (devDeps needed for nest build)
RUN npm ci

# Copy all source code
COPY . .

# Build TypeScript → dist/
RUN npm run build

# Verify dist was created — build fails here if nest build didn't produce output
RUN ls -la /app/dist && echo "✅ dist/ OK"

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install production deps (prisma CLI stays — it's a devDep but needed for migrations at runtime)
# So we install ALL deps then prune non-essential ones, keeping prisma
RUN npm ci

# ✅ Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
