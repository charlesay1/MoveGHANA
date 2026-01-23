import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_URL_FILE: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_SECRET_FILE: z.string().min(1).optional(),
  CORS_ORIGINS: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['info', 'debug', 'warn', 'error']).default('info'),
  APP_VERSION: z.string().optional().default('dev'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;
