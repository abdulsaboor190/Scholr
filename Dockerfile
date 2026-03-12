FROM node:20-slim

WORKDIR /app

# Install system deps required by Prisma
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy everything in one shot
COPY . .

# Install all dependencies (dev included — needed for nest build & prisma CLI)
RUN npm ci

# Compile TypeScript → /app/dist/
RUN npm run build

# Hard-fail the build if dist/main.js doesn't exist
RUN test -f /app/dist/main.js || \
    (echo "FATAL: /app/dist/main.js not found after build! Build output:" && \
     ls -la /app && \
     ls -la /app/dist 2>/dev/null || echo "dist/ does not exist" && \
     exit 1)

EXPOSE 3000

# Use full path to avoid PATH issues in non-login shell
CMD ["/bin/sh", "-c", "/app/node_modules/.bin/prisma db push --accept-data-loss && node /app/dist/main.js"]
