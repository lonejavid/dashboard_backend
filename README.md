# Dashboard API (NestJS)

Read-only API for the Shield Analytics dashboard. Connects to PostgreSQL and exposes `GET /api/dashboard` with optional query params.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your DB and CORS settings
```

## Scripts

| Script        | Description                    |
|---------------|--------------------------------|
| `npm run build` | Compile to `dist/`           |
| `npm run start` | Run production build         |
| `npm run start:dev` | Run in watch mode (dev)  |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3001`) |
| `DB_HOST` | Yes (prod) | PostgreSQL host |
| `DB_PORT` | No | PostgreSQL port (default `5432`) |
| `DB_NAME` | No | Database name |
| `DB_USER` | Yes (prod) | Database user |
| `DB_PASSWORD` | Yes (prod) | Database password |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated origins or `*` (default `*`) |

## Deploy to Render

1. **New → Web Service**, connect repo (backend only or monorepo with root dir).
2. **Build command:** `npm install --include=dev && npm run build`
3. **Start command:** `npm run start`
4. **Environment:** Add all `DB_*` variables and optionally `CORS_ALLOWED_ORIGINS` (e.g. `https://your-app.vercel.app` or `*`).
5. Deploy. The API will be at `https://<your-service>.onrender.com`.

## Endpoints

- `GET /` — Health check (`{ "ok": true, "service": "dashboard-api" }`).
- `GET /api/dashboard?from=&to=&plan=&provider=&subscription=` — Dashboard data (read-only).
