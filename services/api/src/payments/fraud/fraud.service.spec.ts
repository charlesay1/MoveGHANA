describe('FraudService', () => {
  let FraudService: typeof import('./fraud.service').FraudService;

  beforeAll(async () => {
    jest.resetModules();
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'test-secret-123456';
    process.env.APP_ENV = 'dev';
    process.env.NODE_ENV = 'development';
    process.env.FRAUD_HOLD_SCORE = '30';
    process.env.FRAUD_BLOCK_SCORE = '90';
    const mod = await import('./fraud.service');
    FraudService = mod.FraudService;
  });

  it('blocks when account is blocked', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM blocked_accounts')) {
          return { rows: [{ id: '1', reason: 'manual' }] };
        }
        return { rows: [{ count: '0' }] };
      }),
    } as unknown as { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ count?: string }> }> };

    const service = new FraudService();
    const res = await service.assessPaymentRisk(client as any, {
      riderId: 'r1',
      amount: 10,
      currency: 'GHS',
      phoneNumber: '233240000000',
      deviceId: 'dev-1',
    });

    expect(res.status).toBe('blocked');
  });

  it('reviews when amount threshold is exceeded', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM blocked_accounts')) {
          return { rows: [] };
        }
        return { rows: [{ count: '0' }] };
      }),
    } as unknown as { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ count?: string }> }> };

    const service = new FraudService();
    const res = await service.assessPaymentRisk(client as any, {
      riderId: 'r2',
      amount: 1000,
      currency: 'GHS',
      phoneNumber: '233240000000',
    });

    expect(res.status).toBe('review');
  });
});
