import { Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { config } from '../config/config';

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  async query<T = unknown>(text: string, params?: unknown[]) {
    return this.pool.query<T>(text, params);
  }

  async readiness(): Promise<{ dbUp: boolean; migrationsApplied: boolean }> {
    const dbUp = await this.isDbUp();
    if (!dbUp) return { dbUp: false, migrationsApplied: false };
    const migrationsApplied = await this.areMigrationsApplied();
    return { dbUp: true, migrationsApplied };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async isDbUp(): Promise<boolean> {
    try {
      await this.withTimeout(this.pool.query('SELECT 1'), 2000);
      return true;
    } catch {
      return false;
    }
  }

  private async areMigrationsApplied(): Promise<boolean> {
    try {
      const result = await this.withTimeout(
        this.pool.query(
          "SELECT to_regclass('public.users') AS users, to_regclass('public.otp_codes') AS otp_codes, to_regclass('public.sessions') AS sessions"
        ),
        2000
      );
      const row = result.rows[0] as {
        users: string | null;
        otp_codes: string | null;
        sessions: string | null;
      };
      return Boolean(row?.users && row?.otp_codes && row?.sessions);
    } catch {
      return false;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeout = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('DB readiness timeout')), ms);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}

@Module({
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
