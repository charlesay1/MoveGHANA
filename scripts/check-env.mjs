import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const targetArg = args.find((arg) => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'local';

const required = {
  api: ['DATABASE_URL', 'JWT_SECRET', 'PORT'],
  rider: ['EXPO_PUBLIC_API_URL'],
  driver: ['EXPO_PUBLIC_API_URL'],
  business: ['NEXT_PUBLIC_API_URL'],
  admin: ['NEXT_PUBLIC_API_URL'],
};

const getEnvFile = (baseDir, name) => {
  const envTarget = resolve(baseDir, `.env.${target}`);
  const envLocal = resolve(baseDir, `.env.local`);
  const envDefault = resolve(baseDir, '.env');
  if (existsSync(envTarget)) return envTarget;
  if (existsSync(envLocal)) return envLocal;
  if (existsSync(envDefault)) return envDefault;
  return null;
};

const parseEnv = (filePath) => {
  const content = readFileSync(filePath, 'utf-8');
  const entries = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('='));
  return Object.fromEntries(entries.map(([key, ...rest]) => [key, rest.join('=').trim()]));
};

const checks = [
  { name: 'api', dir: 'services/api' },
  { name: 'rider', dir: 'apps/rider' },
  { name: 'driver', dir: 'apps/driver' },
  { name: 'business', dir: 'apps/business' },
  { name: 'admin', dir: 'apps/admin' },
];

let ok = true;

for (const check of checks) {
  const file = getEnvFile(resolve(process.cwd(), check.dir), check.name);
  if (!file) {
    console.error(`[env] Missing .env for ${check.name} (${check.dir})`);
    ok = false;
    continue;
  }

  const env = parseEnv(file);
  const missing = (required[check.name] || []).filter((key) => !env[key]);
  if (missing.length) {
    console.error(`[env] ${check.name} missing: ${missing.join(', ')} (${file})`);
    ok = false;
  }
}

if (!ok) {
  process.exit(1);
}
