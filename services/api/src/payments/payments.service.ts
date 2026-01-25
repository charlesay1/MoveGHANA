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
import type { PaymentProvider, ProviderContext, ProviderName } from '../modules/payments/providers/provider.interface';
import { MockProvider } from '../modules/payments/providers/mock.provider';
import { MtnMomoProvider } from '../modules/payments/providers/mtn.momo.provider';
import { VodafoneCashProvider } from '../modules/payments/providers/vodafone.cash.provider';
import { AirtelTigoMoneyProvider } from '../modules/payments/providers/airteltigo.money.provider';
import { PayoutsService } from './payouts/payouts.service';
import { FraudService } from './fraud/fraud.service';
import { GovernanceService } from './governance/governance.service';
import { paymentsMetrics } from './payments.metrics';
import { buildWebhookIdempotencyKey } from './webhook.util';

export type CreateIntentInput = {
  tripId: string;
  riderId: string;
  amount: number;
  currency: string;
  provider: ProviderName;
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

  private readonly providers: Record<ProviderName, PaymentProvider>;

  constructor(
    private readonly db: DbService,
    private readonly ledger: LedgerService,
    private readonly commission: CommissionService,
    private readonly payouts: PayoutsService,
    private readonly fraud: FraudService,
    private readonly governance: GovernanceService,
    mockProvider: MockProvider,
    mtnProvider: MtnMomoProvider,
    vodafoneProvider: VodafoneCashProvider,
    airtelTigoProvider: AirtelTigoMoneyProvider
  ) {
    this.providers = {
      mock: mockProvider,
      mtn: mtnProvider,
      vodafone: vodafoneProvider,
      airteltigo: airtelTigoProvider,
    };
  }

  onModuleInit() {
    if (config.PAYMENTS_PROVIDER_MODE === 'live' && config.PAYMENTS_PROVIDER === 'mock') {
      throw new Error('PAYMENTS_PROVIDER cannot be mock in live mode.');
    }
  }

  async createPaymentIntent(input: CreateIntentInput, idempotencyKey: string, meta: RequestMeta) {
    return this.db.transaction(async (client) => {
      const existing = await this.findIdempotentResponse(client, idempotencyKey);
      if (existing) return existing;

      const amount = normalizeAmount(input.amount);
      const provider = this.getProvider(input.provider);
      this.ensureProviderAllowed(provider.name);

      const fraud = await this.fraud.assessPaymentRisk(client, {
        riderId: input.riderId,
        amount,
        currency: input.currency,
        phoneNumber: input.phoneNumber,
        deviceId: meta.deviceId,
        ip: meta.ip,
        country: meta.country,
      });

      const riskStatus = fraud.status;
      const riskReason = fraud.reasons.length > 0 ? fraud.reasons.join(';') : null;
      const intentStatus = riskStatus === 'blocked' ? 'failed' : riskStatus === 'review' ? 'review' : 'created';

      const intentRes = await client.query<{ id: string; status: string }>(
        'INSERT INTO payment_intents (rider_id, trip_id, amount, currency, provider, status, risk_score, risk_status, risk_reason, device_id, phone_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, status',
        [
          input.riderId,
          input.tripId,
          amount,
          input.currency,
          provider.name,
          intentStatus,
          fraud.score,
          riskStatus,
          riskReason,
          fraud.deviceHash,
          fraud.phoneHash,
        ]
      );
      const intentId = intentRes.rows[0].id;

      if (fraud.reasons.length > 0) {
        await this.fraud.recordFlags(client, {
          intentId,
          riderId: input.riderId,
          reasons: fraud.reasons,
          score: fraud.score,
          details: {
            amount,
            currency: input.currency,
            country: meta.country,
          },
        });
      }

      if (riskStatus !== 'clear') {
        const response = { intentId, status: intentStatus, riskStatus };
        await this.insertTransaction(client, {
          type: 'payment',
          status: intentStatus,
          idempotencyKey,
          metadata: {
            action: 'intent_create',
            intentId,
            provider: provider.name,
            risk: fraud,
            response,
          },
        });
        await this.insertAuditLog(client, {
          actor: input.riderId,
          action: 'payment_intent_flagged',
          target: intentId,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
          payloadHash: this.hashPayload({ ...input, phoneNumber: 'redacted' }),
        });
        paymentsMetrics.intentTotal.inc({ provider: provider.name, status: intentStatus });
        return response;
      }

      const ctx = this.buildProviderContext(idempotencyKey, meta);
      const started = Date.now();
      const providerResult = await provider.initiatePayment(
        {
          intentId,
          amount,
          currency: input.currency,
          phoneNumber: input.phoneNumber,
          riderId: input.riderId,
          tripId: input.tripId,
        },
        ctx
      );
      paymentsMetrics.providerLatency.observe(
        { provider: provider.name, action: 'initiate' },
        (Date.now() - started) / 1000
      );

      const nextStatus = providerResult.status === 'authorized' ? 'authorized' : intentStatus;
      await client.query('UPDATE payment_intents SET provider_ref = $1, status = $2, updated_at = now() WHERE id = $3', [
        providerResult.providerRef,
        nextStatus,
        intentId,
      ]);

      const response = {
        intentId,
        status: nextStatus,
        checkoutInstructions: providerResult.checkoutInstructions,
      };

      await this.insertTransaction(client, {
        type: 'payment',
        status: nextStatus,
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

      paymentsMetrics.intentTotal.inc({ provider: provider.name, status: nextStatus });
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
        provider: ProviderName;
        provider_ref: string | null;
        status: string;
        risk_status: string | null;
        risk_score: number | null;
      }>('SELECT * FROM payment_intents WHERE id = $1 FOR UPDATE', [intentId]);

      const intent = intentRes.rows[0];
      if (!intent) throw new Error('Payment intent not found.');

      if (intent.risk_status === 'review') {
        const response = { intentId: intent.id, status: 'review' as const };
        await this.insertTransaction(client, {
          type: 'payment',
          status: 'review',
          idempotencyKey,
          metadata: { action: 'intent_confirm', intentId, response },
        });
        return response;
      }

      if (intent.risk_status === 'blocked') {
        const response = { intentId: intent.id, status: 'failed' as const };
        await this.insertTransaction(client, {
          type: 'payment',
          status: 'failed',
          idempotencyKey,
          metadata: { action: 'intent_confirm', intentId, response },
        });
        return response;
      }

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
      this.ensureProviderAllowed(provider.name);
      const ctx = this.buildProviderContext(idempotencyKey, meta);
      const started = Date.now();
      const confirm = await provider.verifyPayment(
        {
          intentId: intent.id,
          providerRef: intent.provider_ref ?? undefined,
          amount: Number(intent.amount),
          currency: intent.currency,
          phoneNumber: input.phoneNumber,
          riderId: intent.rider_id,
        },
        ctx
      );
      paymentsMetrics.providerLatency.observe(
        { provider: provider.name, action: 'verify' },
        (Date.now() - started) / 1000
      );

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
        paymentsMetrics.intentTotal.inc({ provider: provider.name, status: 'failed' });
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
        paymentsMetrics.intentTotal.inc({ provider: provider.name, status: 'authorized' });
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

      const platformWallets = await this.governance.ensurePlatformWallets(client, intent.currency);
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
        toAccountId: platformWallets.treasury.accounts.escrow,
        amount,
        txnId,
      });

      if (split.commission > 0) {
        await this.ledger.postTransfer(client, {
          fromAccountId: platformWallets.treasury.accounts.escrow,
          toAccountId: platformWallets.revenue.accounts.available,
          amount: split.commission,
          txnId,
        });
      }

      if (split.net > 0) {
        await this.ledger.postTransfer(client, {
          fromAccountId: platformWallets.treasury.accounts.escrow,
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

      paymentsMetrics.intentTotal.inc({ provider: provider.name, status: 'captured' });
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

  async handleWebhook(providerName: ProviderName, payload: unknown, headers: Record<string, string | string[] | undefined>) {
    const provider = this.getProvider(providerName);
    this.ensureProviderAllowed(provider.name);
    const event = provider.webhookHandler(headers, payload);
    const idempotencyKey = buildWebhookIdempotencyKey(providerName, event.eventId);
    if (event.timestamp) {
      const delayMs = Date.now() - new Date(event.timestamp).getTime();
      if (!Number.isNaN(delayMs) && delayMs >= 0) {
        paymentsMetrics.webhookDelay.observe({ provider: provider.name }, delayMs / 1000);
      }
    }

    return this.db.transaction(async (client) => {
      const existing = await this.findIdempotentResponse(client, idempotencyKey);
      if (existing) return existing;

      const intentRes = await client.query<{ id: string; rider_id: string; amount: number; currency: string; status: string; provider_ref: string | null; risk_status: string | null }>(
        'SELECT * FROM payment_intents WHERE id = $1 FOR UPDATE',
        [event.intentId]
      );
      const intent = intentRes.rows[0];
      if (!intent) throw new Error('Payment intent not found.');

      let status: 'captured' | 'failed' | 'review' = 'failed';
      if (event.status === 'captured') status = 'captured';
      if (intent.risk_status === 'review') status = 'review';

      const txnId = await this.insertTransaction(client, {
        type: 'payment',
        status: status === 'review' ? 'review' : status,
        idempotencyKey,
        metadata: { action: 'webhook', intentId: intent.id, provider: providerName, status, eventId: event.eventId },
      });

      if (intent.status !== 'captured' && status === 'captured' && intent.risk_status !== 'review') {
        const amount = normalizeAmount(Number(event.amount ?? intent.amount));
        const driverId = event.driverId || 'driver_mock';

        const platformWallets = await this.governance.ensurePlatformWallets(client, intent.currency);
        const riderWallet = await this.ensureWallet(client, 'rider', intent.rider_id, intent.currency, ['available']);
        const driverWallet = await this.ensureWallet(client, 'driver', driverId, intent.currency, ['available']);

        const rule = await this.commission.getActiveRule('ride');
        const split = this.commission.computeSplit(amount, rule);

        await this.ledger.postTransfer(client, {
          fromAccountId: riderWallet.accounts.available,
          toAccountId: platformWallets.treasury.accounts.escrow,
          amount,
          txnId,
        });

        if (split.commission > 0) {
          await this.ledger.postTransfer(client, {
            fromAccountId: platformWallets.treasury.accounts.escrow,
            toAccountId: platformWallets.revenue.accounts.available,
            amount: split.commission,
            txnId,
          });
        }

        if (split.net > 0) {
          await this.ledger.postTransfer(client, {
            fromAccountId: platformWallets.treasury.accounts.escrow,
            toAccountId: driverWallet.accounts.available,
            amount: split.net,
            txnId,
          });
        }
      }

      await client.query('UPDATE payment_intents SET status = $1, provider_ref = $2, updated_at = now() WHERE id = $3', [
        status === 'review' ? 'review' : status,
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
      paymentsMetrics.intentTotal.inc({ provider: provider.name, status: status === 'review' ? 'review' : status });
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

  async requestPayout(driverId: string, amount: number, provider: ProviderName, destination: string, idempotencyKey: string, meta: RequestMeta) {
    return this.db.transaction(async (client) => {
      const existing = await this.findIdempotentResponse(client, idempotencyKey);
      if (existing) return existing;

      const normalized = normalizeAmount(amount);
      const providerAdapter = this.getProvider(provider as ProviderName);
      this.ensureProviderAllowed(providerAdapter.name);
      const platformWallets = await this.governance.ensurePlatformWallets(client, 'GHS');
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
        platformPendingAccountId: platformWallets.treasury.accounts.pending,
        driverAvailableAccountId: driverWallet.accounts.available,
      });

      const ctx = this.buildProviderContext(idempotencyKey, meta);
      const started = Date.now();
      const payoutResult = await providerAdapter.payout(
        {
          payoutId,
          driverId,
          amount: normalized,
          currency: 'GHS',
          destination,
        },
        ctx
      );
      paymentsMetrics.providerLatency.observe(
        { provider: providerAdapter.name, action: 'payout' },
        (Date.now() - started) / 1000
      );
      paymentsMetrics.payoutDelay.observe(
        { provider: providerAdapter.name, status: payoutResult.status },
        (Date.now() - started) / 1000
      );

      await client.query('UPDATE payouts SET status = $1, provider_ref = $2 WHERE id = $3', [
        payoutResult.status,
        payoutResult.providerRef ?? null,
        payoutId,
      ]);

      const response = { payoutId, status: payoutResult.status };
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

      paymentsMetrics.payoutTotal.inc({ provider: providerAdapter.name, status: payoutResult.status });
      return response;
    });
  }

  async providerHealth(providerName?: ProviderName) {
    const provider = this.getProvider(providerName || config.PAYMENTS_PROVIDER);
    return provider.healthCheck();
  }

  private getProvider(name?: ProviderName): PaymentProvider {
    const key = name || config.PAYMENTS_PROVIDER;
    const provider = this.providers[key];
    if (!provider) throw new Error('Unsupported payment provider.');
    return provider;
  }

  private ensureProviderAllowed(provider: ProviderName) {
    if (config.PAYMENTS_PROVIDER_MODE === 'live' && provider === 'mock') {
      throw new Error('Mock provider is not allowed in live mode.');
    }
    if (config.PAYMENTS_PROVIDER_MODE === 'mock' && provider !== 'mock') {
      throw new Error('Live provider is not allowed in mock mode.');
    }
  }

  private buildProviderContext(idempotencyKey: string, meta: RequestMeta): ProviderContext {
    return {
      idempotencyKey,
      correlationId: crypto.randomUUID(),
      requestId: meta.requestId,
    };
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
  deviceId?: string;
  country?: string;
};
