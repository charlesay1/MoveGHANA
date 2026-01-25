import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DbService } from '../../../db/db.module';

export type FinancialAccountOwnerType = 'platform' | 'rider' | 'driver' | 'merchant' | 'ops';

@Injectable()
export class FinosWalletsService {
  constructor(private readonly db: DbService) {}

  async ensureFinancialAccount(client: PoolClient, ownerType: FinancialAccountOwnerType, ownerId: string, currency: string) {
    const res = await client.query<{ id: string }>(
      `INSERT INTO financial_accounts (owner_type, owner_id, currency, status)
       VALUES ($1,$2,$3,'active')
       ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status
       RETURNING id`,
      [ownerType, ownerId, currency]
    );
    return res.rows[0].id;
  }

  async listPlatformAccounts(currency: string) {
    const res = await this.db.query(
      `SELECT id, owner_id, status FROM financial_accounts
       WHERE owner_type = 'platform' AND currency = $1
       ORDER BY owner_id`,
      [currency]
    );
    return res.rows;
  }
}
