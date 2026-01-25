import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { loadPlatformWalletConfig } from './governance.config';

export type PlatformWallets = {
  treasury: { walletId: string; accounts: { escrow: string; available: string; pending: string } };
  revenue: { walletId: string; accounts: { available: string } };
  reserve: { walletId: string; accounts: { available: string } };
  insurance: { walletId: string; accounts: { available: string } };
  regulatoryHold: { walletId: string; accounts: { available: string } };
  ops: { walletId: string; accounts: { available: string } };
};

@Injectable()
export class GovernanceService {
  private readonly cfg = loadPlatformWalletConfig();

  async ensurePlatformWallets(client: PoolClient, currency: string): Promise<PlatformWallets> {
    const treasury = await this.ensureWallet(client, this.cfg.treasuryOwnerId, currency, ['escrow', 'available', 'pending']);
    const revenueRaw = await this.ensureWallet(client, this.cfg.revenueOwnerId, currency, ['available']);
    const reserveRaw = await this.ensureWallet(client, this.cfg.reserveOwnerId, currency, ['available']);
    const insuranceRaw = await this.ensureWallet(client, this.cfg.insuranceOwnerId, currency, ['available']);
    const regulatoryHoldRaw = await this.ensureWallet(client, this.cfg.regulatoryHoldOwnerId, currency, ['available']);
    const opsRaw = await this.ensureWallet(client, this.cfg.opsOwnerId, currency, ['available']);

    return {
      treasury,
      revenue: { walletId: revenueRaw.walletId, accounts: { available: revenueRaw.accounts.available } },
      reserve: { walletId: reserveRaw.walletId, accounts: { available: reserveRaw.accounts.available } },
      insurance: { walletId: insuranceRaw.walletId, accounts: { available: insuranceRaw.accounts.available } },
      regulatoryHold: { walletId: regulatoryHoldRaw.walletId, accounts: { available: regulatoryHoldRaw.accounts.available } },
      ops: { walletId: opsRaw.walletId, accounts: { available: opsRaw.accounts.available } },
    };
  }

  private async ensureWallet(
    client: PoolClient,
    ownerId: string,
    currency: string,
    accountTypes: Array<'available' | 'pending' | 'escrow'>
  ) {
    const walletRes = await client.query<{ id: string }>(
      'INSERT INTO wallets (owner_type, owner_id, currency, status) VALUES ($1,$2,$3,$4) ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status RETURNING id',
      ['platform', ownerId, currency, 'active']
    );
    const walletId = walletRes.rows[0].id;
    const accounts: Record<'available' | 'pending' | 'escrow', string> = { available: '', pending: '', escrow: '' };

    for (const type of accountTypes) {
      const res = await client.query<{ id: string }>(
        'INSERT INTO ledger_accounts (wallet_id, type, currency, balance) VALUES ($1,$2,$3,$4) ON CONFLICT (wallet_id, type, currency) DO UPDATE SET wallet_id = EXCLUDED.wallet_id RETURNING id',
        [walletId, type, currency, 0]
      );
      accounts[type] = res.rows[0].id;
    }

    return { walletId, accounts: accounts as { escrow: string; available: string; pending: string } };
  }
}
