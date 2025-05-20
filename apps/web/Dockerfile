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

# Copy built assets and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["yarn", "start"]
