# Docker environments

Both stacks read application settings and `DB_USER`, `DB_PASSWORD`, and `DB_NAME` from `.env`.
Always select a Compose file explicitly.

## Development

```sh
docker compose -f docker-compose.dev.yaml up --build
```

Open http://localhost:3000. Nginx proxies Vite and its hot-reload WebSocket.
Source files are bind-mounted, and container dependencies use a separate volume.
Postgres runs without TLS; no certificates are needed. Authentication and site URLs
are set to http://localhost:3000. Migrations run before the app starts.
Re-run with `--build` after dependency or migration changes.

```sh
docker compose -f docker-compose.dev.yaml down
```

## Production

Set production application URLs in `.env`, including `BETTER_AUTH_URL` and
`SITE_URL`. Set `DB_SSL_SERVERNAME` to the database certificate hostname.
Provide `certs/fullchain.pem` and `certs/privkey.pem`, readable by the services.

```sh
docker compose -f docker-compose.prod.yaml up -d --build
```

Production serves the built app over HTTPS on port 443 and redirects port 80 to
HTTPS. PostgreSQL also uses TLS. Nginx serves built static assets directly.
The existing `2o` project name and data volumes are preserved; development uses
its own `2o-dev` project and volumes.

```sh
docker compose -f docker-compose.prod.yaml down
```
