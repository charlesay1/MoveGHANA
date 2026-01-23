import fs from 'fs';
import path from 'path';
import type { Logger } from 'pino';
import { config } from '../config/config';

const resolveMigrationsDir = () => {
  const candidates = [
    path.resolve(process.cwd(), 'services', 'api', 'migrations'),
    path.resolve(process.cwd(), 'migrations'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0];
};

export const runMigrationsIfDev = async (logger?: Logger) => {
  if (config.NODE_ENV !== 'development') return;
  try {
    const { migrate } = await import('node-pg-migrate');
    const migrationsDir = resolveMigrationsDir();
    await migrate({
      direction: 'up',
      databaseUrl: config.DATABASE_URL,
      migrationsDir,
      log: (message: string) => logger?.info({ msg: 'migration', detail: message }),
    });
    logger?.info({ msg: 'migrations_applied' });
  } catch (error) {
    logger?.warn({ msg: 'migrations_skipped', error: (error as Error).message });
  }
};
