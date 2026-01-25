import { BadRequestException, Body, Controller, Get, Header, HttpStatus, Optional, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { getMetrics, register } from '../metrics/metrics';
import { DbService } from '../db/db.module';
import { PaymentsService } from '../payments/payments.service';
import { SettlementService } from '../modules/settlement/settlement.service';
import { FinosTreasuryService } from '../modules/finos/treasury/treasury.service';
import { FinosReportingService } from '../modules/finos/reporting/reporting.service';
import { FinosRiskService } from '../modules/finos/risk/risk.service';
import { config } from '../config/config';

@Controller('v1/ops')
export class OpsController {
  constructor(
    private readonly db: DbService,
    @Optional() private readonly payments?: PaymentsService,
    @Optional() private readonly settlements?: SettlementService,
    @Optional() private readonly treasury?: FinosTreasuryService,
    @Optional() private readonly reporting?: FinosReportingService,
    @Optional() private readonly risk?: FinosRiskService
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

  @Get('treasury-status')
  async treasuryStatus() {
    if (!this.treasury) return { status: 'not_configured' };
    return this.treasury.getTreasuryStatus('GHS');
  }

  @Post('treasury-rebalance')
  async treasuryRebalance() {
    return { status: 'noop', message: 'treasury rebalance hook' };
  }

  @Get('finos-report')
  async finosReport() {
    if (!this.reporting) return { status: 'not_configured' };
    return this.reporting.dailySummary('GHS');
  }

  @Get('risk-cases')
  async riskCases() {
    if (!this.risk) return { status: 'not_configured' };
    return this.risk.listRiskCases();
  }

  @Post('risk-cases/:id/resolve')
  async resolveRiskCase(@Req() req: Request) {
    if (!this.risk) return { status: 'not_configured' };
    const id = req.params['id'];
    const action = (req.query['action'] as string) || 'clear';
    if (!['clear', 'block'].includes(action)) {
      throw new BadRequestException('action must be clear or block');
    }
    return this.risk.resolveRiskCase(id, action as 'clear' | 'block');
  }
}
