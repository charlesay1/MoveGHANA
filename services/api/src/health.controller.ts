import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  status() {
    return {
      status: 'ok',
      version: process.env.APP_VERSION || 'dev',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
  }
}
