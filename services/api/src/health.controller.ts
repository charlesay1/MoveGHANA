import { Controller, Get, HttpStatus, Optional, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DbService } from './db/db.module';
import { config } from './config/config';
import net from 'net';
import { PaymentsService } from './payments/payments.service';

@Controller()
export class HealthController {
  constructor(private readonly db: DbService, @Optional() private readonly payments?: PaymentsService) {}

  @Get('health')
  health(@Req() req: Request) {
    return {
      status: 'ok',
      service: 'movegh-api',
      version: process.env.APP_VERSION || 'dev',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
  }

  @Get('ready')
  async ready(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const readiness = await this.db.readiness();
    const redisStatus = await this.checkRedis();
    const redisOk = redisStatus === 'up' || redisStatus === 'not_configured';
    let paymentsStatus: 'up' | 'down' | 'degraded' | 'skipped' = 'skipped';
    if (config.NODE_ENV === 'development' && this.payments) {
      const health = await this.payments.providerHealth();
      paymentsStatus = health === 'ok' ? 'up' : health === 'down' ? 'down' : 'degraded';
    }
    const paymentsOk = paymentsStatus !== 'down';
    const ok = readiness.dbUp && readiness.migrationsApplied && redisOk && paymentsOk;
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: ok ? 'ok' : 'degraded',
      service: 'movegh-api',
      dependencies: {
        db: readiness.dbUp ? 'up' : 'down',
        migrations: readiness.migrationsApplied ? 'up' : 'down',
        redis: redisStatus,
        payments: paymentsStatus,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
  }

  @Get('live')
  live(@Req() req: Request) {
    return {
      status: 'live',
      service: 'movegh-api',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
  }

  private async checkRedis(): Promise<'up' | 'down' | 'not_configured'> {
    if (!config.REDIS_URL) return 'not_configured';
    try {
      const url = new URL(config.REDIS_URL);
      const port = Number(url.port || '6379');
      const host = url.hostname;
      const reachable = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection({ host, port, timeout: 1000 }, () => {
          socket.end();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });
      return reachable ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
