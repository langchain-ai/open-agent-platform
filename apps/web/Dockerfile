# Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root manifest and workspace manifest
COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/package.json

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the repository
COPY . .

# Build the web app
WORKDIR /app/apps/web
RUN yarn build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Copy built assets and dependencies
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs

WORKDIR /app/apps/web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
USER non-root
CMD ["yarn", "start"]
