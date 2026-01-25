import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DbService } from '../../db/db.module';
import { LedgerService } from '../ledger/ledger.service';
import { normalizeAmount } from '../ledger/ledger.types';

@Injectable()
export class PayoutsService {
  constructor(private readonly db: DbService, private readonly ledger: LedgerService) {}

  async createPayout(client: PoolClient, params: { driverId: string; amount: number; currency: string; provider: string; destination: string; txnId: string; platformPendingAccountId: string; driverAvailableAccountId: string }) {
    const amount = normalizeAmount(params.amount);
    await this.ledger.postTransfer(client, {
      fromAccountId: params.driverAvailableAccountId,
      toAccountId: params.platformPendingAccountId,
      amount,
      txnId: params.txnId,
    });

    const res = await client.query<{ id: string }>(
      'INSERT INTO payouts (driver_id, amount, currency, provider, destination, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [params.driverId, amount, params.currency, params.provider, params.destination, 'queued']
    );
    return res.rows[0].id;
  }
}
