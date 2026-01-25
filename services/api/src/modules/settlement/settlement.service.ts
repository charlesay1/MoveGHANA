import { Injectable } from '@nestjs/common';
import { DbService } from '../../db/db.module';
import { paymentsMetrics } from '../../payments/payments.metrics';
import { loadPlatformWalletConfig } from '../../payments/governance/governance.config';

export type SettlementStatus = 'pending' | 'matched' | 'mismatch';

@Injectable()
export class SettlementService {
  private readonly cfg = loadPlatformWalletConfig();

  constructor(private readonly db: DbService) {}

  async getLatestSettlement() {
    const res = await this.db.query(
      'SELECT * FROM settlements ORDER BY created_at DESC LIMIT 1'
    );
    const row = res.rows[0] || null;
    if (row?.created_at) {
      const lag = Date.now() - new Date(row.created_at as string).getTime();
      if (!Number.isNaN(lag) && lag >= 0) {
        paymentsMetrics.reconciliationLag.set(lag / 1000);
      }
    }
    return row;
  }

  async runReconciliation(params: { provider: string; currency: string; providerTotal?: number; periodStart: string; periodEnd: string }) {
    const ledgerTotal = await this.getLedgerEscrowTotal(params.currency);
    const providerTotal = params.providerTotal ?? null;
    const drift = providerTotal === null ? null : Number((ledgerTotal - providerTotal).toFixed(2));
    const status: SettlementStatus = providerTotal === null ? 'pending' : drift === 0 ? 'matched' : 'mismatch';

    const res = await this.db.query<{ id: string }>(
      `INSERT INTO settlements (provider, currency, period_start, period_end, ledger_total, provider_total, drift_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [params.provider, params.currency, params.periodStart, params.periodEnd, ledgerTotal, providerTotal, drift, status]
    );

    const report = {
      provider: params.provider,
      currency: params.currency,
      ledgerTotal,
      providerTotal,
      drift,
      status,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      createdAt: new Date().toISOString(),
    };

    await this.db.query(
      'INSERT INTO reconciliation_reports (settlement_id, report) VALUES ($1, $2)',
      [res.rows[0].id, JSON.stringify(report)]
    );

    if (drift !== null && drift !== 0) {
      await this.db.query(
        'INSERT INTO transactions (type, status, metadata) VALUES ($1, $2, $3)',
        ['adjustment', 'drift_detected', JSON.stringify({ settlementId: res.rows[0].id, drift })]
      );
    }

    if (drift !== null) {
      paymentsMetrics.ledgerDrift.set(drift);
      paymentsMetrics.settlementDriftAmount.set(drift);
    }
    paymentsMetrics.reconciliationLag.set(0);

    return { settlementId: res.rows[0].id, ...report };
  }

  async getLedgerEscrowTotal(currency: string) {
    const res = await this.db.query<{ total: string }>(
      `SELECT COALESCE(SUM(la.balance), 0)::text AS total
       FROM ledger_accounts la
       JOIN wallets w ON w.id = la.wallet_id
       WHERE w.owner_type = 'platform' AND w.owner_id = $1 AND la.type = 'escrow' AND la.currency = $2`,
      [this.cfg.treasuryOwnerId, currency]
    );
    return Number(res.rows[0]?.total || 0);
  }
}
