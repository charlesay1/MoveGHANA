import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const migrationsDir = path.resolve('services', 'api', 'migrations');
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js'));

const pool = new Pool({ connectionString: databaseUrl });
try {
  const result = await pool.query('SELECT name FROM pgmigrations');
  const applied = result.rows.map((row) => row.name);
  const missing = files.filter((f) => !applied.includes(f));
  const unknown = applied.filter((name) => !files.includes(name));

  if (missing.length > 0 || unknown.length > 0) {
    console.error(`Schema drift detected. Missing: ${missing.join(', ')} Unknown: ${unknown.join(', ')}`);
    process.exit(1);
  }

  console.log('Schema drift check passed');
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await pool.end();
}
