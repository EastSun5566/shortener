# Shortener

> A self-hosted URL shortener

[![GHCR Version](https://ghcr-badge.egpl.dev/eastsun5566/shortener/latest_tag?ignore=latest&label=version)](https://github.com/EastSun5566/shortener/pkgs/container/shortener)
[![GHCR Image Size](https://ghcr-badge.egpl.dev/eastsun5566/shortener/size?tag=latest&label=image%20size)](https://github.com/EastSun5566/shortener/pkgs/container/shortener)

![Shortener demo](demo.gif)

## Features

- Create and manage short links
- User registration and login
- Redirect and click tracking
- PostgreSQL storage
- Redis caching

## Images

| Image                                | Use case                                      |
| ------------------------------------ | --------------------------------------------- |
| `ghcr.io/eastsun5566/shortener`      | Production app; requires PostgreSQL and Redis |
| `ghcr.io/eastsun5566/shortener-demo` | Single-container, temporary demo              |

## Quick Start

### Demo

Run everything in one container:

```bash
docker run --rm \
  -p 8080:8080 \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  ghcr.io/eastsun5566/shortener-demo:2.0.0
```

Open <http://localhost:8080>.

Demo data is temporary and may be lost after a restart or redeploy. Do not use this image for production.

### Production

Docker Compose starts the app, PostgreSQL, and Redis:

```bash
git clone https://github.com/EastSun5566/shortener.git
cd shortener
cp .env.example .env
```

Set secure values in `.env`:

```env
DB_PASSWORD=change-this
JWT_SECRET=replace-with-at-least-32-characters
CORS_ORIGINS=https://your-domain.com
```

Start the services:

```bash
docker pull ghcr.io/eastsun5566/shortener:latest
docker compose -f docker-compose.prod.yml up -d
```

- App: <http://localhost:8080>
- Health check: <http://localhost:8080/health>

## Upgrading from 1.x

Version 2.0 uses PostgreSQL 18 with new `db_data_v18` and `cache_data_v8` volumes. It starts with an empty database and does not migrate or delete old volumes.

Back up PostgreSQL before upgrading. Use `pg_dump` and `pg_restore` if you need to keep existing data. Do not mount a PostgreSQL 16 data directory directly into PostgreSQL 18.

## Development

Requires Node.js 24, pnpm 10.34.5, and Docker.

```bash
docker compose up db cache -d
pnpm install
cp server/.env.example server/.env
pnpm server:dev
pnpm web:dev
```

Run the server and web commands in separate terminals.

## Checks

```bash
pnpm check
pnpm test:e2e
```
