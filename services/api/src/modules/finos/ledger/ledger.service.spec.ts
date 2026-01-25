import { FinosLedgerService } from './ledger.service';

describe('FinosLedgerService', () => {
  it('rejects negative amount', async () => {
    const service = new FinosLedgerService({} as any);
    await expect(service.postDoubleEntry({} as any, { amount: -1 } as any)).rejects.toThrow();
  });

  it('detects invariant violations', async () => {
    const db = {
      query: jest.fn(async () => ({ rows: [{ tx_id: 'tx1', net: '5' }] })),
    };
    const service = new FinosLedgerService(db as any);
    const res = await service.invariantCheck();
    expect(res.ok).toBe(false);
    expect(res.violations.length).toBe(1);
  });
});
