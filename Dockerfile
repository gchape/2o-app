FROM node:26.12.1-alpine AS base
RUN npm install -g pnpm@12.14.0
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM dependencies AS build
COPY . .
RUN pnpm build

FROM build AS migrate
ENV NODE_ENV=production
CMD ["pnpm", "db:migrate"]

FROM node:26.12.1-alpine AS app
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

FROM nginx:1.31-alpine AS web
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
