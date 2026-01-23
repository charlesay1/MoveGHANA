import { readFileSync } from 'fs';
import { envSchema } from './env.schema';
import { loadEnv } from './load-env';

const readSecretFile = (path?: string): string | undefined => {
  if (!path) return undefined;
  try {
    return readFileSync(path, 'utf8').trim();
  } catch {
    return undefined;
  }
};

loadEnv();
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const env = parsed.data;

const databaseUrl = env.DATABASE_URL ?? readSecretFile(env.DATABASE_URL_FILE);
if (!databaseUrl) {
  throw new Error('DATABASE_URL or DATABASE_URL_FILE is required.');
}

const jwtSecret = env.JWT_SECRET ?? readSecretFile(env.JWT_SECRET_FILE);
if (!jwtSecret) {
  throw new Error('JWT_SECRET or JWT_SECRET_FILE is required.');
}

const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

process.env.DATABASE_URL = databaseUrl;
process.env.JWT_SECRET = jwtSecret;

export const config = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT ?? env.API_PORT ?? 4000,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret,
  CORS_ORIGINS: corsOrigins,
  LOG_LEVEL: env.LOG_LEVEL,
  APP_VERSION: env.APP_VERSION || 'dev',
};
