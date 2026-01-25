import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DbService } from '../../../db/db.module';
import { paymentsMetrics } from '../../../payments/payments.metrics';

@Injectable()
export class FinosEscrowService {
  constructor(private readonly db: DbService) {}

  async hold(client: PoolClient, params: { tripId: string; intentId: string; amount: number; currency: string }) {
    const res = await client.query<{ id: string }>(
      `INSERT INTO escrow_holds (trip_id, intent_id, amount, currency, status)
       VALUES ($1,$2,$3,$4,'held') RETURNING id`,
      [params.tripId, params.intentId, params.amount, params.currency]
    );
    paymentsMetrics.escrowHoldTotal.inc({ state: 'held' });
    return res.rows[0].id;
  }

  async release(client: PoolClient, holdId: string) {
    await client.query('UPDATE escrow_holds SET status = $1, updated_at = now() WHERE id = $2', ['released', holdId]);
    paymentsMetrics.escrowHoldTotal.inc({ state: 'released' });
  }

  async dispute(client: PoolClient, holdId: string) {
    await client.query('UPDATE escrow_holds SET status = $1, updated_at = now() WHERE id = $2', ['disputed', holdId]);
    paymentsMetrics.escrowHoldTotal.inc({ state: 'disputed' });
  }

  async refund(client: PoolClient, holdId: string) {
    await client.query('UPDATE escrow_holds SET status = $1, updated_at = now() WHERE id = $2', ['refunded', holdId]);
    paymentsMetrics.escrowHoldTotal.inc({ state: 'refunded' });
  }

  async listOpenHolds() {
    const res = await this.db.query('SELECT * FROM escrow_holds WHERE status = $1', ['held']);
    return res.rows;
  }
}
