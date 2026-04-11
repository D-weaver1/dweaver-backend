# Backend Setup

## Environment

Create a local config file:

```bash
cp .env.example .env
```

## Database

Start PostgreSQL in Docker:

```bash
docker compose up -d postgres
```

## Install dependencies

```bash
npm install
```

## Run in development

Terminal 1 — build watcher:

```bash
npm run build:watch
```

Terminal 2 — start server (after initial build):

```bash
npm run start:watch
```

## Migrations

Generate migration:

```bash
npm run migration:generate --name=<name>
```

Create empty migration:

```bash
npm run migration:create --name=<name>
```

Run migrations:

```bash
npm run migration:run
```

Show migration status:

```bash
npm run migration:show
```

Revert last migration:

```bash
npm run migration:revert
```
