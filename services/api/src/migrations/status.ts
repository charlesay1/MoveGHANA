import { Pool } from 'pg';
import { config } from '../config/config';

const run = async () => {
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  try {
    const result = await pool.query(
      'SELECT name, run_on FROM pgmigrations ORDER BY run_on DESC'
    );
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          status: 'ok',
          applied: result.rows,
        },
        null,
        2
      )
    );
  } catch (error) {
    const message = (error as Error).message || '';
    if (message.includes('pgmigrations') && message.includes('does not exist')) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ status: 'ok', applied: [] }, null, 2));
    } else {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
