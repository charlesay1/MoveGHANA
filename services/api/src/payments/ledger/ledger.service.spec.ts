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
});
