import { buildTransferEntries } from './ledger.types';

describe('LedgerService', () => {
  it('builds debit/credit entries and balances', () => {
    const from = { id: 'a', balance: 100, type: 'available' as const };
    const to = { id: 'b', balance: 10, type: 'available' as const };
    const entries = buildTransferEntries(from, to, 15.55);
    expect(entries.debit.balanceAfter).toBe(84.45);
    expect(entries.credit.balanceAfter).toBe(25.55);
    expect(entries.debit.amount).toBe(15.55);
  });

  it('keeps ledger entries balanced', () => {
    const from = { id: 'a', balance: 50, type: 'available' as const };
    const to = { id: 'b', balance: 0, type: 'available' as const };
    const entries = buildTransferEntries(from, to, 20);
    const total = entries.debit.amount + entries.credit.amount;
    expect(total).toBe(40);
    expect(entries.debit.amount).toBe(entries.credit.amount);
  });
});
