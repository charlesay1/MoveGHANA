import { Injectable } from '@nestjs/common';
import { DbService } from '../../../db/db.module';
import { loadPlatformWalletConfig } from '../../../payments/governance/governance.config';

@Injectable()
export class FinosTreasuryService {
  private readonly cfg = loadPlatformWalletConfig();

  constructor(private readonly db: DbService) {}

  async getTreasuryStatus(currency: string) {
    const balances = await this.db.query<{ type: string; balance: string }>(
      `SELECT la.type, la.balance::text AS balance
       FROM ledger_accounts la
       JOIN wallets w ON w.id = la.wallet_id
       WHERE w.owner_type = 'platform' AND w.owner_id = $1 AND la.currency = $2`,
      [this.cfg.treasuryOwnerId, currency]
    );

    const summary: Record<string, number> = { available: 0, pending: 0, escrow: 0 };
    for (const row of balances.rows) {
      if (row.type in summary) {
        summary[row.type] = Number(row.balance);
      }
    }

    const minReserve = 500;
    const status = summary.available < minReserve ? 'low_liquidity' : 'ok';

    return {
      currency,
      treasuryOwnerId: this.cfg.treasuryOwnerId,
      balances: summary,
      minReserve,
      status,
    };
  }

  async dailyReport(currency: string) {
    const treasury = await this.getTreasuryStatus(currency);
    const payouts = await this.db.query<{ count: string; total: string }>(
      `SELECT COUNT(*)::text AS count, COALESCE(SUM(amount),0)::text AS total
       FROM payouts WHERE currency = $1 AND created_at > now() - interval '24 hours'`,
      [currency]
    );
    return {
      treasury,
      payouts: { count: Number(payouts.rows[0]?.count || 0), total: Number(payouts.rows[0]?.total || 0) },
      timestamp: new Date().toISOString(),
    };
  }
}
