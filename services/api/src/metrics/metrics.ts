import { Counter, Histogram, collectDefaultMetrics, register } from 'prom-client';
import type { NextFunction, Request, Response } from 'express';

let initialized = false;

export const initMetrics = () => {
  if (initialized) return;
  initialized = true;
  collectDefaultMetrics();
};

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpRequestCount = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = httpRequestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    const route = req.route?.path || req.path || req.originalUrl || 'unknown';
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestCount.inc(labels);
    start(labels);
  });
  next();
};

export const getMetrics = () => register.metrics();
export { register };
