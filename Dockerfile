FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

COPY package.json yarn.lock ./
COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml

COPY apps/ ./apps/
COPY packages/ ./packages/
COPY turbo.json ./

RUN corepack enable
RUN yarn install --immutable

COPY . .

EXPOSE 3000

CMD ["yarn", "dev"]
