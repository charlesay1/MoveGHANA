import { Injectable } from '@nestjs/common';
import { DbService } from '../../db/db.module';
import { normalizeAmount } from '../ledger/ledger.types';

export type CommissionRule = {
  id: string;
  name: string;
  percent: number;
  fixed_fee: number;
  applies_to: 'ride' | 'delivery';
  active: boolean;
};

export const computeCommission = (amount: number, percent: number, fixedFee: number) => {
  const commission = normalizeAmount(amount * percent + fixedFee);
  return commission > amount ? normalizeAmount(amount) : commission;
};

@Injectable()
export class CommissionService {
  constructor(private readonly db: DbService) {}

  async getActiveRule(appliesTo: 'ride' | 'delivery'): Promise<CommissionRule | null> {
    const res = await this.db.query<CommissionRule>(
      'SELECT id, name, percent::numeric AS percent, fixed_fee::numeric AS fixed_fee, applies_to, active FROM commission_rules WHERE applies_to = $1 AND active = true ORDER BY created_at DESC LIMIT 1',
      [appliesTo]
    );
    return res.rows[0] ?? null;
  }

  computeSplit(amount: number, rule?: CommissionRule | null) {
    if (!rule) {
      return { commission: 0, net: normalizeAmount(amount), percent: 0, fixedFee: 0 };
    }
    const percent = Number(rule.percent);
    const fixedFee = Number(rule.fixed_fee);
    const commission = computeCommission(amount, percent, fixedFee);
    const net = normalizeAmount(amount - commission);
    return { commission, net, percent, fixedFee };
  }
}
