import { Injectable } from '@nestjs/common';
import { DbService } from '../../../db/db.module';

@Injectable()
export class FinosRiskService {
  constructor(private readonly db: DbService) {}

  async listRiskCases() {
    const res = await this.db.query(
      `SELECT id, rider_id, amount, currency, risk_score, risk_status, risk_reason, created_at
       FROM payment_intents
       WHERE risk_status IN ('review', 'blocked')
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.rows;
  }

  async resolveRiskCase(intentId: string, action: 'clear' | 'block') {
    const status = action === 'clear' ? 'clear' : 'blocked';
    const res = await this.db.query(
      `UPDATE payment_intents
       SET risk_status = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, risk_status`,
      [status, intentId]
    );
    if (!res.rows[0]) throw new Error('Risk case not found');
    return res.rows[0];
  }
}
