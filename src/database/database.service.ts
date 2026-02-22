import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { config } from '../config';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor() {
    const { db } = config;
    this.pool = new Pool({
      host: db.host,
      port: db.port,
      database: db.database,
      user: db.user,
      password: db.password,
      ssl: db.host !== 'localhost' ? { rejectUnauthorized: false } : false,
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
