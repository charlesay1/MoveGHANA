import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DbService } from '../../../db/db.module';
import { paymentsMetrics } from '../../../payments/payments.metrics';
import { buildTransferEntries, type LedgerAccountRow } from '../../../payments/ledger/ledger.types';

export type LedgerEntry = {
  txId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  memo?: string;
  eventType?: string;
  idempotencyKey?: string;
};

@Injectable()
export class FinosLedgerService {
  constructor(private readonly db: DbService) {}

  async postDoubleEntry(client: PoolClient, entry: LedgerEntry) {
    if (entry.amount <= 0) throw new Error('Amount must be positive.');
    const accounts = await client.query<LedgerAccountRow>(
      'SELECT id, balance::numeric AS balance, type FROM ledger_accounts WHERE id = ANY($1) FOR UPDATE',
      [[entry.debitAccountId, entry.creditAccountId]]
    );
    const from = accounts.rows.find((row) => row.id === entry.debitAccountId);
    const to = accounts.rows.find((row) => row.id === entry.creditAccountId);
    if (!from || !to) throw new Error('Ledger account not found.');

    const entries = buildTransferEntries(from, to, entry.amount);

    await client.query('UPDATE ledger_accounts SET balance = $1 WHERE id = $2', [entries.debit.balanceAfter, entries.debit.accountId]);
    await client.query('UPDATE ledger_accounts SET balance = $1 WHERE id = $2', [entries.credit.balanceAfter, entries.credit.accountId]);

    await client.query(
      `INSERT INTO ledger_entries (account_id, txn_id, direction, amount, balance_after, debit_account_id, credit_account_id, currency, memo, event_type, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        entries.debit.accountId,
        entry.txId,
        'debit',
        entries.debit.amount,
        entries.debit.balanceAfter,
        entry.debitAccountId,
        entry.creditAccountId,
        entry.currency,
        entry.memo ?? null,
        entry.eventType ?? null,
        entry.idempotencyKey ?? null,
      ]
    );

    await client.query(
      `INSERT INTO ledger_entries (account_id, txn_id, direction, amount, balance_after, debit_account_id, credit_account_id, currency, memo, event_type, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        entries.credit.accountId,
        entry.txId,
        'credit',
        entries.credit.amount,
        entries.credit.balanceAfter,
        entry.debitAccountId,
        entry.creditAccountId,
        entry.currency,
        entry.memo ?? null,
        entry.eventType ?? null,
        entry.idempotencyKey ?? null,
      ]
    );
  }

  async invariantCheck(): Promise<{ ok: boolean; violations: Array<{ txId: string; net: number }> }> {
    const res = await this.db.query<{ tx_id: string; net: string }>(
      `SELECT txn_id AS tx_id,
        COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0)::text AS net
       FROM ledger_entries
       WHERE txn_id IS NOT NULL
       GROUP BY txn_id
       HAVING COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) <> 0`
    );
    if (res.rows.length > 0) {
      paymentsMetrics.ledgerInvariantFailTotal.inc(res.rows.length);
    }
    return {
      ok: res.rows.length === 0,
      violations: res.rows.map((row) => ({ txId: row.tx_id, net: Number(row.net) })),
    };
  }
}
