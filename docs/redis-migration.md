# Redis migration

The app now uses the `redis` Node.js client and Redis 8 with Search and JSON.
Docker Compose runs `redis:8.10.2-alpine`; keep its default command so all components load.
See the [Redis 8 release notes](https://redis.io/docs/latest/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.0-release-notes/).

## Configuration

Replace `VALKEY_HOST` and `VALKEY_PORT` with `REDIS_HOST` and `REDIS_PORT` in
local environments, deployment secrets, and CI. Defaults are `localhost:6379`.
Compose sets the host to `redis` for the app and migration containers. For host
Node.js development, connect to a separately running Redis 8 instance; Compose
keeps Redis on its internal network and does not publish its port.

## Cutover

The new `redisdata` volume starts empty. The old `valkeydata` volume is left on
disk. This code change does not transfer existing data or change running services.

Before a production cutover, choose how to handle existing sessions and carts:

- A fresh start clears active sessions, carts, rate limits, and temporary auth
  tokens. Users must sign in again. Catalog data remains in Postgres; the search
  index refills automatically, and stats refill on demand.
- To preserve sessions and carts, stop app writes and transfer string and hash
  keys to Redis while preserving their expiration times. Validate the transfer
  before restarting the app. Rebuild catalog JSON documents and search indexes
  from Postgres. Do not mount a Valkey bundle data directory into Redis: module
  data formats and newer snapshot versions may differ.

For an accepted fresh start, deploy the new configuration with:

```sh
docker compose up -d --build
```

Validate Search and JSON and explicitly rebuild the catalog using the app image:

```sh
docker compose run --rm migrate pnpm search:check
docker compose run --rm migrate pnpm search:sync
```

The `migrate` image contains the scripts and dependencies; the runtime app image
contains only the production build. These commands require Redis and Postgres to
be running. Keep the old volume until the deployment has been validated. Avoid
`docker compose down -v`, which also removes the Postgres volume.
