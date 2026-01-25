import { Injectable, OnModuleInit } from '@nestjs/common';
import crypto from 'crypto';
import pino from 'pino';
import { context, trace } from '@opentelemetry/api';
import type { PoolClient } from 'pg';
import { config } from '../config/config';
import { DbService } from '../db/db.module';
import { CommissionService } from './commission/commission.service';
import { LedgerService } from './ledger/ledger.service';
import { normalizeAmount } from './ledger/ledger.types';
import type { MomoProvider, MomoProviderName, WebhookEvent } from './providers/momo.provider.interface';
import { MockProvider } from './providers/mock.provider';
import { MtnProvider } from './providers/mtn.provider';
import { VodafoneProvider } from './providers/vodafone.provider';
import { AirtelTigoProvider } from './providers/airteltigo.provider';
import { PayoutsService } from './payouts/payouts.service';

export type CreateIntentInput = {
  tripId: string;
  riderId: string;
  amount: number;
  currency: string;
  provider: MomoProviderName;
  phoneNumber: string;
};

export type ConfirmIntentInput = {
  phoneNumber: string;
  driverId?: string;
};

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = pino({
    level: config.LOG_LEVEL,
    base: { service: 'movegh-api', scope: 'payments' },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin: () => {
      const span = trace.getSpan(context.active());
      if (!span) return { trace_id: 'n/a', span_id: 'n/a' };
      const { traceId, spanId } = span.spanContext();
      return { trace_id: traceId, span_id: spanId };
    },
  });

  private readonly providers: Record<MomoProviderName, MomoProvider>;

  constructor(
    private readonly db: DbService,
    private readonly ledger: LedgerService,
    private readonly commission: CommissionService,
    private readonly payouts: PayoutsService,
    mockProvider: MockProvider,
    mtnProvider: MtnProvider,
    vodafoneProvider: VodafoneProvider,
    airtelTigoProvider: AirtelTigoProvider
  ) {
    this.providers = {
      mock: mockProvider,
      mtn: mtnProvider,
      vodafone: vodafoneProvider,
      airteltigo: airtelTigoProvider,
    };
  }

  onModuleInit() {
    if (config.PAYMENTS_PROVIDER !== 'mock') {
      this.ensureProviderSecrets(config.PAYMENTS_PROVIDER);
    }
  }

  async createPaymentIntent(input: CreateIntentInput, idempotencyKey: string, meta: RequestMeta) {
    return this.db.transaction(async (client) => {
      const existing = await this.findIdempotentResponse(client, idempotencyKey);
      if (existing) return existing;

      const amount = normalizeAmount(input.amount);
      const provider = this.getProvider(input.provider);

      const intentRes = await client.query<{ id: string; status: string }>(
        'INSERT INTO payment_intents (rider_id, trip_id, amount, currency, provider, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, status',
        [input.riderId, input.tripId, amount, input.currency, provider.name, 'created']
      );
      const intentId = intentRes.rows[0].id;

      const providerResult = await provider.initiatePayment({
        intentId,
        amount,
        currency: input.currency,
        phoneNumber: input.phoneNumber,
        riderId: input.riderId,
        tripId: input.tripId,
      });

      await client.query('UPDATE payment_intents SET provider_ref = $1, updated_at = now() WHERE id = $2', [
        providerResult.providerRef,
        intentId,
      ]);

      const response = {
        intentId,
        status: 'created',
        checkoutInstructions: providerResult.checkoutInstructions,
      };

      await this.insertTransaction(client, {
        type: 'payment',
        status: 'created',
        idempotencyKey,
        metadata: {
          action: 'intent_create',
          intentId,
          provider: provider.name,
          response,
        },
      });

      await this.insertAuditLog(client, {
        actor: input.riderId,
        action: 'payment_intent_create',
        target: intentId,
        requestId: meta.requestId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        payloadHash: this.hashPayload(input),
      });

      this.logger.info({
        msg: 'payment_intent_created',
        intentId,
        provider: provider.name,
        amount,
        currency: input.currency,
        requestId: meta.requestId,
      });

      return response;
    });
  }

  async confirmPaymentIntent(intentId: string, input: ConfirmIntentInput, idempotencyKey: string, meta: RequestMeta) {
    return this.db.transaction(async (client) => {
      const existing = await this.findIdempotentResponse(client, idempotencyKey);
      if (existing) return existing;

      const intentRes = await client.query<{
        id: string;
        rider_id: string;
        trip_id: string;
        amount: number;
        currency: string;
        provider: MomoProviderName;
        provider_ref: string | null;
        status: string;
      }>('SELECT * FROM payment_intents WHERE id = $1 FOR UPDATE', [intentId]);

      const intent = intentRes.rows[0];
      if (!intent) throw new Error('Payment intent not found.');

      if (intent.status === 'captured') {
        const response = { intentId: intent.id, status: intent.status };
        await this.insertTransaction(client, {
          type: 'payment',
          status: intent.status,
          idempotencyKey,
          metadata: { action: 'intent_confirm', intentId, response },
        });
        return response;
      }

      const provider = this.getProvider(intent.provider);
      const confirm = await provider.confirmPayment({
        intentId: intent.id,
        amount: Number(intent.amount),
        currency: intent.currency,
        phoneNumber: input.phoneNumber,
        riderId: intent.rider_id,
      });

      if (confirm.status === 'failed') {
        await client.query('UPDATE payment_intents SET status = $1, updated_at = now() WHERE id = $2', ['failed', intent.id]);
        await this.insertTransaction(client, {
          type: 'payment',
          status: 'failed',
          idempotencyKey,
          metadata: { action: 'intent_confirm', intentId, response: { intentId: intent.id, status: 'failed' } },
        });
        await this.insertAuditLog(client, {
          actor: intent.rider_id,
          action: 'payment_intent_failed',
          target: intent.id,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
          payloadHash: this.hashPayload({ intentId: intent.id, status: 'failed' }),
        });
        return { intentId: intent.id, status: 'failed' };
      }

      if (confirm.status === 'authorized') {
        await client.query('UPDATE payment_intents SET status = $1, provider_ref = $2, updated_at = now() WHERE id = $3', [
          'authorized',
          confirm.providerRef || intent.provider_ref,
          intent.id,
        ]);
        const response = { intentId: intent.id, status: 'authorized' as const };
        await this.insertTransaction(client, {
          type: 'payment',
          status: 'authorized',
          idempotencyKey,
          metadata: { action: 'intent_confirm', intentId: intent.id, response },
        });
        await this.insertAuditLog(client, {
          actor: intent.rider_id,
          action: 'payment_intent_authorized',
          target: intent.id,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
          payloadHash: this.hashPayload({ intentId: intent.id, status: 'authorized' }),
        });
        return response;
      }

      const driverId = input.driverId || 'driver_mock';
      const amount = normalizeAmount(Number(intent.amount));

      const platformWallet = await this.ensureWallet(client, 'platform', 'movegh', intent.currency, ['escrow', 'available', 'pending']);
      const riderWallet = await this.ensureWallet(client, 'rider', intent.rider_id, intent.currency, ['available']);
      const driverWallet = await this.ensureWallet(client, 'driver', driverId, intent.currency, ['available']);

      const rule = await this.commission.getActiveRule('ride');
      const split = this.commission.computeSplit(amount, rule);

      const txnId = await this.insertTransaction(client, {
        type: 'payment',
        status: 'captured',
        idempotencyKey,
        metadata: {
          action: 'intent_confirm',
          intentId: intent.id,
          provider: provider.name,
          commission: split,
          driverId,
        },
      });

      await this.ledger.postTransfer(client, {
        fromAccountId: riderWallet.accounts.available,
        toAccountId: platformWallet.accounts.escrow,
        amount,
        txnId,
      });

      if (split.commission > 0) {
        await this.ledger.postTransfer(client, {
          fromAccountId: platformWallet.accounts.escrow,
          toAccountId: platformWallet.accounts.available,
          amount: split.commission,
          txnId,
        });
      }

      if (split.net > 0) {
        await this.ledger.postTransfer(client, {
          fromAccountId: platformWallet.accounts.escrow,
          toAccountId: driverWallet.accounts.available,
          amount: split.net,
          txnId,
        });
      }

      await client.query('UPDATE payment_intents SET status = $1, provider_ref = $2, updated_at = now() WHERE id = $3', [
        'captured',
        confirm.providerRef || intent.provider_ref,
        intent.id,
      ]);

      await this.insertAuditLog(client, {
        actor: intent.rider_id,
        action: 'payment_intent_captured',
        target: intent.id,
        requestId: meta.requestId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        payloadHash: this.hashPayload({ intentId: intent.id, driverId }),
      });

      const response = { intentId: intent.id, status: 'captured' as const };
      await this.updateTransactionResponse(client, idempotencyKey, response);

      this.logger.info({
        msg: 'payment_intent_captured',
        intentId: intent.id,
        driverId,
        amount,
        commission: split.commission,
        requestId: meta.requestId,
      });

      return response;
    });
  }

  async handleWebhook(providerName: MomoProviderName, payload: unknown, headers: Record<string, string | string[] | undefined>) {
    const provider = this.getProvider(providerName);
    if (!provider.verifyWebhook(headers, payload)) {
      throw new Error('Invalid webhook signature.');
    }

    const event = provider.parseWebhook(payload);
    const idempotencyKey = `webhook:${providerName}:${event.eventId}`;

    return this.db.transaction(async (client) => {
      const existing = await this.findIdempotentResponse(client, idempotencyKey);
      if (existing) return existing;

      const intentRes = await client.query<{ id: string; rider_id: string; amount: number; currency: string; status: string; provider_ref: string | null }>(
        'SELECT * FROM payment_intents WHERE id = $1 FOR UPDATE',
        [event.intentId]
      );
      const intent = intentRes.rows[0];
      if (!intent) throw new Error('Payment intent not found.');

      let status: 'captured' | 'failed' = 'failed';
      if (event.status === 'captured') status = 'captured';

      const txnId = await this.insertTransaction(client, {
        type: 'payment',
        status,
        idempotencyKey,
        metadata: { action: 'webhook', intentId: intent.id, provider: providerName, status, eventId: event.eventId },
      });

      if (intent.status !== 'captured' && status === 'captured') {
        const amount = normalizeAmount(Number(event.amount ?? intent.amount));
        const driverId = event.driverId || 'driver_mock';

        const platformWallet = await this.ensureWallet(client, 'platform', 'movegh', intent.currency, ['escrow', 'available', 'pending']);
        const riderWallet = await this.ensureWallet(client, 'rider', intent.rider_id, intent.currency, ['available']);
        const driverWallet = await this.ensureWallet(client, 'driver', driverId, intent.currency, ['available']);

        const rule = await this.commission.getActiveRule('ride');
        const split = this.commission.computeSplit(amount, rule);

        await this.ledger.postTransfer(client, {
          fromAccountId: riderWallet.accounts.available,
          toAccountId: platformWallet.accounts.escrow,
          amount,
          txnId,
        });

        if (split.commission > 0) {
          await this.ledger.postTransfer(client, {
            fromAccountId: platformWallet.accounts.escrow,
            toAccountId: platformWallet.accounts.available,
            amount: split.commission,
            txnId,
          });
        }

        if (split.net > 0) {
          await this.ledger.postTransfer(client, {
            fromAccountId: platformWallet.accounts.escrow,
            toAccountId: driverWallet.accounts.available,
            amount: split.net,
            txnId,
          });
        }
      }

      await client.query('UPDATE payment_intents SET status = $1, provider_ref = $2, updated_at = now() WHERE id = $3', [
        status,
        event.providerRef || intent.provider_ref,
        intent.id,
      ]);

      await this.insertAuditLog(client, {
        actor: intent.rider_id,
        action: 'payment_webhook',
        target: intent.id,
        requestId: undefined,
        ip: undefined,
        userAgent: undefined,
        payloadHash: this.hashPayload({ eventId: event.eventId, status }),
      });

      const response = { status: 'ok' };
      await this.updateTransactionResponse(client, idempotencyKey, response);
      return response;
    });
  }

  async getWalletBalances(ownerType: 'rider' | 'driver', ownerId: string, currency: string) {
    const wallet = await this.db.query<{ id: string }>(
      'SELECT id FROM wallets WHERE owner_type = $1 AND owner_id = $2 AND currency = $3',
      [ownerType, ownerId, currency]
    );
    if (!wallet.rows[0]) {
      return { walletId: null, balances: { available: 0, pending: 0, escrow: 0 } };
    }
    const walletId = wallet.rows[0].id;
    const accounts = await this.db.query<{ type: string; balance: number }>(
      'SELECT type, balance::numeric AS balance FROM ledger_accounts WHERE wallet_id = $1',
      [walletId]
    );
    const balances = { available: 0, pending: 0, escrow: 0 };
    for (const row of accounts.rows) {
      if (row.type in balances) {
        balances[row.type as keyof typeof balances] = Number(row.balance);
      }
    }
    return { walletId, balances };
  }

  async requestPayout(driverId: string, amount: number, provider: string, destination: string, idempotencyKey: string, meta: RequestMeta) {
    return this.db.transaction(async (client) => {
      const existing = await this.findIdempotentResponse(client, idempotencyKey);
      if (existing) return existing;

      const normalized = normalizeAmount(amount);
      const platformWallet = await this.ensureWallet(client, 'platform', 'movegh', 'GHS', ['pending']);
      const driverWallet = await this.ensureWallet(client, 'driver', driverId, 'GHS', ['available']);

      const txnId = await this.insertTransaction(client, {
        type: 'payout',
        status: 'queued',
        idempotencyKey,
        metadata: { action: 'payout_request', driverId, amount: normalized },
      });

      const payoutId = await this.payouts.createPayout(client, {
        driverId,
        amount: normalized,
        currency: 'GHS',
        provider,
        destination,
        txnId,
        platformPendingAccountId: platformWallet.accounts.pending,
        driverAvailableAccountId: driverWallet.accounts.available,
      });

      const response = { payoutId, status: 'queued' };
      await this.updateTransactionResponse(client, idempotencyKey, response);

      await this.insertAuditLog(client, {
        actor: driverId,
        action: 'payout_request',
        target: payoutId,
        requestId: meta.requestId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        payloadHash: this.hashPayload({ driverId, amount: normalized }),
      });

      return response;
    });
  }

  async providerHealth(providerName?: MomoProviderName) {
    const provider = this.getProvider(providerName || config.PAYMENTS_PROVIDER);
    return provider.healthCheck();
  }

  private getProvider(name?: MomoProviderName): MomoProvider {
    const key = name || config.PAYMENTS_PROVIDER;
    const provider = this.providers[key];
    if (!provider) throw new Error('Unsupported payment provider.');
    return provider;
  }

  private ensureProviderSecrets(provider: MomoProviderName) {
    if (provider === 'mtn') {
      if (!config.MTN_MOMO_API_KEY || !config.MTN_MOMO_API_SECRET) {
        throw new Error('MTN MoMo secrets are required.');
      }
    }
    if (provider === 'vodafone') {
      if (!config.VODAFONE_MOMO_API_KEY || !config.VODAFONE_MOMO_API_SECRET) {
        throw new Error('Vodafone Cash secrets are required.');
      }
    }
    if (provider === 'airteltigo') {
      if (!config.AIRTELTIGO_MOMO_API_KEY || !config.AIRTELTIGO_MOMO_API_SECRET) {
        throw new Error('AirtelTigo Money secrets are required.');
      }
    }
  }

  private hashPayload(payload: unknown) {
    const json = JSON.stringify(payload);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  private async findIdempotentResponse(client: PoolClient, idempotencyKey: string) {
    const res = await client.query<{ metadata: { response?: unknown } }>(
      'SELECT metadata FROM transactions WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (!res.rows[0]) return null;
    const response = res.rows[0].metadata?.response;
    return response ?? { status: 'processing' };
  }

  private async insertTransaction(client: PoolClient, params: { type: string; status: string; idempotencyKey: string; metadata: Record<string, unknown> }) {
    const res = await client.query<{ id: string }>(
      'INSERT INTO transactions (type, status, idempotency_key, metadata) VALUES ($1,$2,$3,$4) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id',
      [params.type, params.status, params.idempotencyKey, JSON.stringify(params.metadata)]
    );
    if (res.rows[0]) return res.rows[0].id;
    const existing = await client.query<{ id: string }>('SELECT id FROM transactions WHERE idempotency_key = $1', [params.idempotencyKey]);
    if (!existing.rows[0]) throw new Error('Unable to persist transaction.');
    return existing.rows[0].id;
  }

  private async updateTransactionResponse(client: PoolClient, idempotencyKey: string, response: unknown) {
    await client.query(
      'UPDATE transactions SET metadata = jsonb_set(metadata, \'{response}\', $2::jsonb, true), updated_at = now() WHERE idempotency_key = $1',
      [idempotencyKey, JSON.stringify(response)]
    );
  }

  private async insertAuditLog(client: PoolClient, params: { actor: string; action: string; target: string; requestId?: string; ip?: string; userAgent?: string; payloadHash: string }) {
    await client.query(
      'INSERT INTO audit_logs (actor, action, target, request_id, ip, user_agent, payload_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [params.actor, params.action, params.target, params.requestId ?? null, params.ip ?? null, params.userAgent ?? null, params.payloadHash]
    );
  }

  private async ensureWallet(
    client: PoolClient,
    ownerType: 'rider' | 'driver' | 'platform',
    ownerId: string,
    currency: string,
    accountTypes: Array<'available' | 'pending' | 'escrow'>
  ) {
    const walletRes = await client.query<{ id: string }>(
      'INSERT INTO wallets (owner_type, owner_id, currency, status) VALUES ($1,$2,$3,$4) ON CONFLICT (owner_type, owner_id, currency) DO UPDATE SET status = EXCLUDED.status RETURNING id',
      [ownerType, ownerId, currency, 'active']
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

    return { walletId, accounts };
  }
}

export type RequestMeta = {
  requestId?: string;
  ip?: string;
  userAgent?: string;
};
