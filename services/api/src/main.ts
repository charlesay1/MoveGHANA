import 'reflect-metadata';
import './tracing';
import helmet from 'helmet';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { context, trace } from '@opentelemetry/api';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
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
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: config.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: config.BODY_LIMIT }));

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

  const getTraceIds = () => {
    const span = trace.getSpan(context.active());
    if (!span) return { trace_id: 'n/a', span_id: 'n/a' };
    const { traceId, spanId } = span.spanContext();
    return { trace_id: traceId, span_id: spanId };
  };

  const logger = pino({
    level: config.LOG_LEVEL,
    base: {
      service: 'movegh-api',
      env: config.NODE_ENV,
      version: config.APP_VERSION,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin: () => getTraceIds(),
  });

  initMetrics();
  app.use(requestIdMiddleware);
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: config.RATE_LIMIT_GLOBAL,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || req.path === '/live',
    handler: (_req, res) => {
      res.status(429).json({ error: 'rate_limited', retry_after: 60 });
    },
  });
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: config.RATE_LIMIT_AUTH,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: 'rate_limited', retry_after: 60 });
    },
  });
  app.use('/auth/otp', authLimiter);
  app.use('/auth/verify', authLimiter);
  app.use(globalLimiter);
  app.use(metricsMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      customProps: (req) => ({ requestId: req.requestId, ...getTraceIds() }),
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
