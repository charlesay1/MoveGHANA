import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const portsDoc = resolve(root, 'docs/ops/ports.md');
if (!existsSync(portsDoc)) {
  console.error('[ports] Missing docs/ops/ports.md');
  process.exit(1);
}

const docText = readFileSync(portsDoc, 'utf-8');
const match = (label) => {
  const re = new RegExp(`- ${label}: (\\d+)`);
  const found = docText.match(re);
  return found ? Number(found[1]) : null;
};

const ports = {
  postgres: match('postgres'),
  api: match('api'),
  business: match('business'),
  admin: match('admin'),
};

for (const [key, value] of Object.entries(ports)) {
  if (!value) {
    console.error(`[ports] Missing ${key} in docs/ops/ports.md`);
    process.exit(1);
  }
}

const checks = [
  {
    file: '.env.example',
    patterns: [new RegExp(`PORT=${ports.api}$`, 'm'), new RegExp(`DB_PORT=${ports.postgres}$`, 'm')],
    mode: 'all',
  },
  {
    file: '.env.development.example',
    patterns: [new RegExp(`PORT=${ports.api}$`, 'm'), new RegExp(`DB_PORT=${ports.postgres}$`, 'm')],
    mode: 'all',
  },
  {
    file: '.env.staging.example',
    patterns: [new RegExp(`PORT=${ports.api}$`, 'm'), new RegExp(`DB_PORT=${ports.postgres}$`, 'm')],
    mode: 'all',
  },
  {
    file: '.env.production.example',
    patterns: [new RegExp(`PORT=${ports.api}$`, 'm'), new RegExp(`DB_PORT=${ports.postgres}$`, 'm')],
    mode: 'all',
  },
  {
    file: 'services/api/.env.example',
    patterns: [
      new RegExp(`PORT=${ports.api}$`, 'm'),
      new RegExp(`API_PORT=${ports.api}$`, 'm'),
    ],
    mode: 'all',
  },
  {
    file: 'services/db/.env.example',
    patterns: [new RegExp(`POSTGRES_PORT=${ports.postgres}$`, 'm')],
    mode: 'all',
  },
  {
    file: 'infra/compose/.env.example',
    patterns: [
      new RegExp(`POSTGRES_PORT=${ports.postgres}$`, 'm'),
      new RegExp(`API_PORT=${ports.api}$`, 'm'),
      new RegExp(`PORT=${ports.api}$`, 'm'),
    ],
    mode: 'all',
  },
  {
    file: 'infra/compose/docker-compose.yml',
    patterns: [
      new RegExp(`${ports.api}:4000`),
      new RegExp(`\$\{API_PORT:-${ports.api}\}`),
    ],
  },
  {
    file: 'apps/business/package.json',
    patterns: [new RegExp(`-p ${ports.business}`)],
  },
  {
    file: 'apps/admin/package.json',
    patterns: [new RegExp(`-p ${ports.admin}`)],
  },
];

let ok = true;
for (const check of checks) {
  const filePath = resolve(root, check.file);
  if (!existsSync(filePath)) {
    console.error(`[ports] Missing ${check.file}`);
    ok = false;
    continue;
  }
  const text = readFileSync(filePath, 'utf-8');
  const matches = check.mode === 'all'
    ? check.patterns.every((pattern) => pattern.test(text))
    : check.patterns.some((pattern) => pattern.test(text));
  if (!matches) {
    console.error(`[ports] ${check.file} does not match port expectations`);
    ok = false;
  }
}

if (!ok) process.exit(1);
