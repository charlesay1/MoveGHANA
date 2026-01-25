import fs from 'fs';
import path from 'path';

const envPath = path.resolve('services', 'api', '.env.prod');
if (!fs.existsSync(envPath)) {
  console.error('Missing services/api/.env.prod');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      if (idx === -1) return [line, ''];
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const errors = [];
if ((env.APP_ENV || '').toLowerCase() !== 'prod') errors.push('APP_ENV must be prod');
if ((env.PAYMENTS_PROVIDER_MODE || '').toLowerCase() !== 'live') errors.push('PAYMENTS_PROVIDER_MODE must be live');
if ((env.PAYMENTS_PROVIDER || '').toLowerCase() === 'mock') errors.push('PAYMENTS_PROVIDER cannot be mock');
if (!String(env.PAYMENTS_PUBLIC_URL || '').startsWith('https://')) errors.push('PAYMENTS_PUBLIC_URL must be https://');

if (errors.length > 0) {
  console.error(`Payments prod checks failed: ${errors.join('; ')}`);
  process.exit(1);
}

console.log('Payments prod checks passed');
