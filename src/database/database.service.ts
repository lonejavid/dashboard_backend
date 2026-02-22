import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'test-db.c6dskocumuuy.us-east-1.rds.amazonaws.com',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'spamsite',
      user: process.env.DB_USER || 'omar',
      password: process.env.DB_PASSWORD || 'omar12345',
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }

  async query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
    const result = await this.pool.query(text, params);
    return { rows: result.rows as T[] };
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
