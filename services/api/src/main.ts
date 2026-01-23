import 'reflect-metadata';
import './tracing';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { config } from './config/config';
import { requestIdMiddleware } from './middleware/requestId';
import { initMetrics, metricsMiddleware } from './metrics/metrics';
import { runMigrationsIfDev } from './migrations/run-migrations';

async function bootstrap() {
  if (config.NODE_ENV === 'production') {
    const weak = config.JWT_SECRET === 'movegh-dev-secret' || config.JWT_SECRET.length < 16;
    if (weak) {
      throw new Error('Refusing to start with weak JWT_SECRET in production.');
    }
  }

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.use(helmet());

  const corsOrigins = config.CORS_ORIGINS;

  if (config.NODE_ENV === 'production' && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set in production.');
  }
  if (corsOrigins.includes('*')) {
    throw new Error('CORS_ORIGINS cannot include wildcard "*" in production-grade mode.');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.length === 0) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS blocked'));
    },
  });

  const logger = pino({
    level: config.LOG_LEVEL,
    base: {
      service: 'movegh-api',
      env: config.NODE_ENV,
      version: config.APP_VERSION,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  initMetrics();
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      customProps: (req) => ({ requestId: req.requestId }),
      redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["set-cookie"]'],
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            requestId: req.requestId,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    })
  );

  await runMigrationsIfDev(logger);
  app.useGlobalFilters(new AllExceptionsFilter());

  logger.info({
    msg: 'startup',
    service: 'movegh-api',
    env: config.NODE_ENV,
    port: config.PORT,
    version: config.APP_VERSION,
    timestamp: new Date().toISOString(),
  });

  await app.listen(config.PORT, '0.0.0.0');
}

bootstrap();
