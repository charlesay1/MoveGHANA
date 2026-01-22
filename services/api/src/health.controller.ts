import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  status() {
    return {
      status: 'ok',
      service: 'movegh-api',
      version: process.env.APP_VERSION || 'dev',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
