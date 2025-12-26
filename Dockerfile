# ================================
# Base Stage
# ================================
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ================================
# Dependencies Stage
# ================================
FROM base AS deps

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate && \
    cp -R node_modules prod_node_modules

RUN npm ci && \
    npx prisma generate

# ================================
# Builder Stage
# ================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ================================
# Production Stage
# ================================
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=deps /app/prod_node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Generate Prisma Client for production
RUN npx prisma generate

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]

# ================================
# Development Stage
# ================================
FROM base AS development

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
