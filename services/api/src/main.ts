import 'reflect-metadata';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required.');
  }
  if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV is required.');
  }
  if (!process.env.CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS is required.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }
  if (!process.env.PORT && !process.env.API_PORT) {
    throw new Error('PORT is required.');
  }
  if (process.env.NODE_ENV === 'production') {
    const weak = jwtSecret === 'movegh-dev-secret' || jwtSecret.length < 16;
    if (weak) {
      throw new Error('Refusing to start with weak JWT_SECRET in production.');
    }
  }

  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const corsOrigins =
    process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || [];

  if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set in production.');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes('*')) return callback(null, true);
      if (corsOrigins.length === 0) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS blocked'));
    },
  });
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string | undefined) || randomUUID();
    res.setHeader('x-request-id', requestId);
    const start = Date.now();
    res.on('finish', () => {
      const log = {
        level: 'info',
        msg: 'request',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      };
      console.log(JSON.stringify(log));
    });
    next();
  });

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port);
}

bootstrap();
