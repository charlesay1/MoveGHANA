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

const appEnv = env.APP_ENV
  ?? (env.NODE_ENV === 'production' ? 'prod' : env.NODE_ENV === 'development' ? 'dev' : 'dev');

const providerMode = env.PAYMENTS_PROVIDER_MODE
  ?? (appEnv === 'dev' ? 'mock' : 'live');

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

if (appEnv === 'dev' && providerMode !== 'mock') {
  throw new Error('PAYMENTS_PROVIDER_MODE must be mock in dev.');
}
if (appEnv !== 'dev' && providerMode !== 'live') {
  throw new Error('PAYMENTS_PROVIDER_MODE must be live in staging/prod.');
}

if (providerMode === 'live') {
  const publicUrl = env.PAYMENTS_PUBLIC_URL || '';
  if (!publicUrl || !publicUrl.startsWith('https://')) {
    throw new Error('PAYMENTS_PUBLIC_URL must be https:// in live mode.');
  }
  if (env.PAYMENTS_PROVIDER === 'mock') {
    throw new Error('PAYMENTS_PROVIDER cannot be mock in live mode.');
  }
}

export const config = {
  NODE_ENV: env.NODE_ENV,
  APP_ENV: appEnv,
  PORT: env.PORT ?? env.API_PORT ?? 4000,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret,
  CORS_ORIGINS: corsOrigins,
  LOG_LEVEL: env.LOG_LEVEL,
  APP_VERSION: env.APP_VERSION || 'dev',
  RATE_LIMIT_GLOBAL: env.RATE_LIMIT_GLOBAL,
  RATE_LIMIT_AUTH: env.RATE_LIMIT_AUTH,
  BODY_LIMIT: env.BODY_LIMIT || '1mb',
  REDIS_URL: env.REDIS_URL,
  PAYMENTS_PROVIDER: env.PAYMENTS_PROVIDER,
  PAYMENTS_PROVIDER_MODE: providerMode,
  PAYMENTS_PUBLIC_URL: env.PAYMENTS_PUBLIC_URL,
  PAYMENTS_SECRETS_DIR: env.PAYMENTS_SECRETS_DIR,
  PAYMENTS_WEBHOOK_SECRET: env.PAYMENTS_WEBHOOK_SECRET || 'movegh-dev-webhook',
  MTN_MOMO_BASE_URL: env.MTN_MOMO_BASE_URL,
  MTN_MOMO_API_KEY: env.MTN_MOMO_API_KEY,
  MTN_MOMO_API_SECRET: env.MTN_MOMO_API_SECRET,
  VODAFONE_MOMO_BASE_URL: env.VODAFONE_MOMO_BASE_URL,
  VODAFONE_MOMO_API_KEY: env.VODAFONE_MOMO_API_KEY,
  VODAFONE_MOMO_API_SECRET: env.VODAFONE_MOMO_API_SECRET,
  AIRTELTIGO_MOMO_BASE_URL: env.AIRTELTIGO_MOMO_BASE_URL,
  AIRTELTIGO_MOMO_API_KEY: env.AIRTELTIGO_MOMO_API_KEY,
  AIRTELTIGO_MOMO_API_SECRET: env.AIRTELTIGO_MOMO_API_SECRET,
  FRAUD_MAX_AMOUNT: env.FRAUD_MAX_AMOUNT,
  FRAUD_RIDER_PER_MIN: env.FRAUD_RIDER_PER_MIN,
  FRAUD_RIDER_PER_DAY: env.FRAUD_RIDER_PER_DAY,
  FRAUD_DEVICE_PER_DAY: env.FRAUD_DEVICE_PER_DAY,
  FRAUD_PHONE_PER_DAY: env.FRAUD_PHONE_PER_DAY,
  FRAUD_HOLD_SCORE: env.FRAUD_HOLD_SCORE,
  FRAUD_BLOCK_SCORE: env.FRAUD_BLOCK_SCORE,
};
