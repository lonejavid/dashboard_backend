/**
 * Application config from environment variables.
 * Production (e.g. Render): set all DB_* and PORT in the dashboard.
 * Development: copy .env.example to .env or set env vars; defaults allow local run.
 */
function optional(key: string, fallback: string): string {
  return (process.env[key] ?? fallback).trim();
}

function optionalInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

export const config = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: optionalInt('PORT', 3001),

  db: {
    host: optional('DB_HOST', 'localhost'),
    port: optionalInt('DB_PORT', 5432),
    database: optional('DB_NAME', 'spamsite'),
    user: optional('DB_USER', ''),
    password: optional('DB_PASSWORD', ''),
  },

  /** Comma-separated origins, or "*" to allow all. */
  corsAllowedOrigins: optional('CORS_ALLOWED_ORIGINS', '*'),
} as const;

export function getCorsOrigin(): boolean | string | string[] | ((origin: string, cb: (err: Error | null, allow?: boolean) => void) => void) {
  const raw = config.corsAllowedOrigins.trim();
  if (raw === '' || raw === '*') return true;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return true;
  return list;
}
