import { Injectable } from '@nestjs/common';
import { DbService } from '../../../db/db.module';

@Injectable()
export class FinosReportingService {
  constructor(private readonly db: DbService) {}

  async dailySummary(currency: string) {
    const intents = await this.db.query<{ count: string; total: string }>(
      `SELECT COUNT(*)::text AS count, COALESCE(SUM(amount),0)::text AS total
       FROM payment_intents WHERE currency = $1 AND created_at > now() - interval '24 hours'`,
      [currency]
    );
    const payouts = await this.db.query<{ count: string; total: string }>(
      `SELECT COUNT(*)::text AS count, COALESCE(SUM(amount),0)::text AS total
       FROM payouts WHERE currency = $1 AND created_at > now() - interval '24 hours'`,
      [currency]
    );
    const disputes = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM disputes WHERE created_at > now() - interval '24 hours'`
    );

    return {
      currency,
      payments: { count: Number(intents.rows[0]?.count || 0), total: Number(intents.rows[0]?.total || 0) },
      payouts: { count: Number(payouts.rows[0]?.count || 0), total: Number(payouts.rows[0]?.total || 0) },
      disputes: { count: Number(disputes.rows[0]?.count || 0) },
      timestamp: new Date().toISOString(),
    };
  }
}
