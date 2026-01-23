import { Counter, Histogram, collectDefaultMetrics, register } from 'prom-client';
import type { NextFunction, Request, Response } from 'express';

const normalizeRoute = (path?: string) => {
  if (!path) return '/unknown';
  const parts = path.split('?')[0].split('/').filter(Boolean);
  const normalized = parts.map((segment) => {
    if (/^[0-9]+$/.test(segment)) return ':id';
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    ) {
      return ':id';
    }
    return segment;
  });
  return '/' + normalized.join('/');
};

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
  const routeLabel = req.route?.path
    ? String(req.route.path)
    : normalizeRoute(req.path);
  const start = httpRequestDuration.startTimer({ method: req.method, route: routeLabel });
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: routeLabel,
      status_code: String(res.statusCode),
    };
    httpRequestCount.inc(labels);
    start(labels);
  });
  next();
};

export const getMetrics = () => register.metrics();
export { register };
