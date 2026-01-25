import { CommissionService, computeCommission } from './commission.service';

describe('CommissionService', () => {
  it('computes commission with percent and fixed fee', () => {
    const commission = computeCommission(100, 0.1, 2);
    expect(commission).toBe(12);
  });

  it('caps commission at amount', () => {
    const commission = computeCommission(10, 1, 5);
    expect(commission).toBe(10);
  });

  it('computes split net amount', () => {
    const service = new CommissionService({} as never);
    const rule = {
      id: 'rule_1',
      name: 'standard',
      percent: 0.2,
      fixed_fee: 1,
      applies_to: 'ride' as const,
      active: true,
    };
    const split = service.computeSplit(50, rule);
    expect(split.commission).toBe(11);
    expect(split.net).toBe(39);
  });
});
