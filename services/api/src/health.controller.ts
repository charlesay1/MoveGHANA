import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DbService } from './db/db.module';

@Controller()
export class HealthController {
  constructor(private readonly db: DbService) {}

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
    const ok = readiness.dbUp && readiness.migrationsApplied;
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: ok ? 'ok' : 'degraded',
      service: 'movegh-api',
      dependencies: {
        db: readiness.dbUp ? 'up' : 'down',
        migrations: readiness.migrationsApplied ? 'up' : 'down',
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
}
