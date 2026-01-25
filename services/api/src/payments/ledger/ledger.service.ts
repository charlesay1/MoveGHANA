import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DbService } from '../../db/db.module';
import { buildTransferEntries, normalizeAmount, type LedgerAccountRow, type LedgerEntryInput } from './ledger.types';

@Injectable()
export class LedgerService {
  constructor(private readonly db: DbService) {}

  async postTransfer(client: PoolClient, params: { fromAccountId: string; toAccountId: string; amount: number; txnId: string }) {
    const amount = normalizeAmount(params.amount);
    if (amount <= 0) throw new Error('Amount must be positive.');

    const accounts = await client.query<LedgerAccountRow>(
      'SELECT id, balance::numeric AS balance, type FROM ledger_accounts WHERE id = ANY($1) FOR UPDATE',
      [[params.fromAccountId, params.toAccountId]]
    );
    const from = accounts.rows.find((row) => row.id === params.fromAccountId);
    const to = accounts.rows.find((row) => row.id === params.toAccountId);
    if (!from || !to) throw new Error('Ledger account not found.');

    if (from.type !== 'pending' && normalizeAmount(from.balance) - amount < 0) {
      throw new Error('Insufficient balance.');
    }

    const entries = buildTransferEntries(from, to, amount);

    await client.query('UPDATE ledger_accounts SET balance = $1 WHERE id = $2', [entries.debit.balanceAfter, entries.debit.accountId]);
    await client.query('UPDATE ledger_accounts SET balance = $1 WHERE id = $2', [entries.credit.balanceAfter, entries.credit.accountId]);

    await this.insertEntry(client, params.txnId, entries.debit);
    await this.insertEntry(client, params.txnId, entries.credit);

    return entries;
  }

  private async insertEntry(client: PoolClient, txnId: string, entry: LedgerEntryInput) {
    await client.query(
      'INSERT INTO ledger_entries (account_id, txn_id, direction, amount, balance_after) VALUES ($1, $2, $3, $4, $5)',
      [entry.accountId, txnId, entry.direction, entry.amount, entry.balanceAfter]
    );
  }
}
