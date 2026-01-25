import fs from 'fs';
import path from 'path';
import { config } from '../../config/config';

export type PlatformWalletConfig = {
  treasuryOwnerId: string;
  revenueOwnerId: string;
  reserveOwnerId: string;
  insuranceOwnerId: string;
  regulatoryHoldOwnerId: string;
  opsOwnerId: string;
};

const defaults: PlatformWalletConfig = {
  treasuryOwnerId: 'movegh_treasury',
  revenueOwnerId: 'movegh_revenue',
  reserveOwnerId: 'movegh_reserve',
  insuranceOwnerId: 'movegh_insurance',
  regulatoryHoldOwnerId: 'movegh_reg_hold',
  opsOwnerId: 'movegh_ops',
};

export const loadPlatformWalletConfig = (): PlatformWalletConfig => {
  const secretsDir = config.PAYMENTS_SECRETS_DIR || path.resolve(process.cwd(), 'services', 'api', 'secrets');
  const filePath = path.join(secretsDir, 'platform.json');
  if (!fs.existsSync(filePath)) return defaults;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw) as Partial<PlatformWalletConfig>;
    return {
      treasuryOwnerId: json.treasuryOwnerId || defaults.treasuryOwnerId,
      revenueOwnerId: json.revenueOwnerId || defaults.revenueOwnerId,
      reserveOwnerId: json.reserveOwnerId || defaults.reserveOwnerId,
      insuranceOwnerId: json.insuranceOwnerId || defaults.insuranceOwnerId,
      regulatoryHoldOwnerId: json.regulatoryHoldOwnerId || defaults.regulatoryHoldOwnerId,
      opsOwnerId: json.opsOwnerId || defaults.opsOwnerId,
    };
  } catch {
    return defaults;
  }
};
