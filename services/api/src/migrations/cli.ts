import fs from 'fs';
import path from 'path';
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

const direction = (process.argv[2] || 'up').toLowerCase();
if (!['up', 'down'].includes(direction)) {
  // eslint-disable-next-line no-console
  console.error('Usage: db:migrate|db:rollback');
  process.exit(1);
}

const run = async () => {
  const { migrate } = await import('node-pg-migrate');
  const migrationsDir = resolveMigrationsDir();
  await migrate({
    direction: direction as 'up' | 'down',
    databaseUrl: config.DATABASE_URL,
    migrationsDir,
    log: (message: string) => {
      // eslint-disable-next-line no-console
      console.log(message);
    },
  });
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
