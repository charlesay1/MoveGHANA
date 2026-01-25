import { BadRequestException, Body, Controller, Get, Header, HttpStatus, Optional, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { getMetrics, register } from '../metrics/metrics';
import { DbService } from '../db/db.module';
import { PaymentsService } from '../payments/payments.service';
import { SettlementService } from '../modules/settlement/settlement.service';
import { config } from '../config/config';

@Controller('v1/ops')
export class OpsController {
  constructor(
    private readonly db: DbService,
    @Optional() private readonly payments?: PaymentsService,
    @Optional() private readonly settlements?: SettlementService
  ) {}

  @Get('metrics')
  @Header('Content-Type', register.contentType)
  async metrics() {
    return getMetrics();
  }

  @Get('health')
  async health(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const readiness = await this.db.readiness();
    const paymentsHealth = this.payments ? await this.payments.providerHealth().catch(() => 'down') : 'skipped';
    const ok = readiness.dbUp && readiness.migrationsApplied && paymentsHealth !== 'down';
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: ok ? 'ok' : 'degraded',
      env: config.APP_ENV,
      dependencies: {
        db: readiness.dbUp ? 'up' : 'down',
        migrations: readiness.migrationsApplied ? 'up' : 'down',
        payments: paymentsHealth,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
  }

  @Get('payments-status')
  async paymentsStatus() {
    const providerHealth = this.payments ? await this.payments.providerHealth().catch(() => 'down') : 'skipped';
    const latestSettlement = this.settlements ? await this.settlements.getLatestSettlement() : null;
    return {
      providerMode: config.PAYMENTS_PROVIDER_MODE,
      provider: config.PAYMENTS_PROVIDER,
      providerHealth,
      latestSettlement,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('settlement-status')
  async settlementStatus() {
    if (!this.settlements) {
      return { status: 'not_configured' };
    }
    const latest = await this.settlements.getLatestSettlement();
    if (!latest) return { status: 'not_run' };
    return { status: 'ok', latest };
  }

  @Post('settlement-run')
  async settlementRun(@Body() body: unknown) {
    if (!this.settlements) {
      return { status: 'not_configured' };
    }
    const schema = z.object({
      provider: z.string().min(1),
      currency: z.string().min(1).default('GHS'),
      providerTotal: z.coerce.number().optional(),
      periodStart: z.string().optional(),
      periodEnd: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join('; '));
    }
    const data = parsed.data;
    const today = new Date().toISOString().slice(0, 10);
    const periodStart = data.periodStart || today;
    const periodEnd = data.periodEnd || today;
    const report = await this.settlements.runReconciliation({
      provider: data.provider,
      currency: data.currency,
      providerTotal: data.providerTotal,
      periodStart,
      periodEnd,
    });
    return { status: 'ok', report };
  }
}
