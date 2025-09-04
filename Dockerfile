FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml

# Copy package.json files for all workspaces
COPY apps/web/package.json ./apps/web/
COPY apps/docs/package.json ./apps/docs/
COPY packages/*/package.json ./packages/*/
COPY turbo.json ./

# Install all dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Expose port for the web app
EXPOSE 3000

# Start the development server
CMD ["yarn", "dev"]