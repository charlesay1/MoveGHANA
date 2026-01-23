import { Controller, Get, Header } from '@nestjs/common';
import { getMetrics, initMetrics, register } from './metrics';

@Controller()
export class MetricsController {
  constructor() {
    initMetrics();
  }

  @Get('metrics')
  @Header('Content-Type', register.contentType)
  async metrics() {
    return getMetrics();
  }
}
