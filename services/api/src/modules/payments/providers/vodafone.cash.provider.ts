import { Injectable } from '@nestjs/common';
import { ProviderBase } from './provider.base';
import { loadProviderConfig } from './provider.config';
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  ProviderContext,
  PayoutInput,
  PayoutResult,
  RefundInput,
  RefundResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
  WebhookEvent,
} from './provider.interface';

const getHeader = (headers: Record<string, string | string[] | undefined>, name: string) => {
  const key = name.toLowerCase();
  const value = headers[key] ?? headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
};

const mapStatus = (raw?: string): InitiatePaymentResult['status'] => {
  if (!raw) return 'created';
  const normalized = raw.toLowerCase();
  if (['success', 'captured', 'completed'].includes(normalized)) return 'captured';
  if (['authorized', 'pending', 'queued', 'processing'].includes(normalized)) return 'authorized';
  if (['failed', 'rejected', 'error'].includes(normalized)) return 'failed';
  return 'created';
};

const mapVerifyStatus = (raw?: string): VerifyPaymentResult['status'] => {
  if (!raw) return 'failed';
  const normalized = raw.toLowerCase();
  if (['success', 'captured', 'completed', 'paid'].includes(normalized)) return 'captured';
  if (['authorized', 'pending', 'queued', 'processing'].includes(normalized)) return 'authorized';
  return 'failed';
};

@Injectable()
export class VodafoneCashProvider extends ProviderBase implements PaymentProvider {
  name: 'vodafone' = 'vodafone';

  constructor() {
    super(loadProviderConfig('vodafone'));
  }

  async initiatePayment(input: InitiatePaymentInput, ctx: ProviderContext): Promise<InitiatePaymentResult> {
    const body = {
      intentId: input.intentId,
      amount: input.amount,
      currency: input.currency,
      phoneNumber: input.phoneNumber,
      riderId: input.riderId,
      tripId: input.tripId,
      merchantId: this.config.merchantId,
    };

    const res = await this.request<Record<string, unknown>>('POST', this.config.endpoints.initiate, body, ctx);
    const providerRef = String(res.data['providerRef'] || res.data['reference'] || res.data['transactionId'] || input.intentId);
    const status = mapStatus(String(res.data['status'] || res.data['state'] || 'created'));
    const checkoutInstructions = String(
      res.data['checkoutInstructions'] || res.data['instruction'] || 'Approve payment on your Vodafone Cash prompt.'
    );

    return { providerRef, status, checkoutInstructions };
  }

  async verifyPayment(input: VerifyPaymentInput, ctx: ProviderContext): Promise<VerifyPaymentResult> {
    const body = {
      intentId: input.intentId,
      providerRef: input.providerRef,
      amount: input.amount,
      currency: input.currency,
      phoneNumber: input.phoneNumber,
      riderId: input.riderId,
      merchantId: this.config.merchantId,
    };

    const res = await this.request<Record<string, unknown>>('POST', this.config.endpoints.verify, body, ctx);
    const providerRef = String(res.data['providerRef'] || res.data['reference'] || res.data['transactionId'] || input.intentId);
    const status = mapVerifyStatus(String(res.data['status'] || res.data['state'] || 'failed'));

    return { providerRef, status };
  }

  async refund(input: RefundInput, ctx: ProviderContext): Promise<RefundResult> {
    const body = {
      intentId: input.intentId,
      providerRef: input.providerRef,
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
      merchantId: this.config.merchantId,
    };

    const res = await this.request<Record<string, unknown>>('POST', this.config.endpoints.refund, body, ctx);
    const providerRef = String(res.data['providerRef'] || res.data['reference'] || input.providerRef);
    const statusRaw = String(res.data['status'] || res.data['state'] || 'failed');
    const status = statusRaw.toLowerCase().includes('failed') ? 'failed' : statusRaw.toLowerCase().includes('settled') ? 'settled' : 'queued';

    return { providerRef, status };
  }

  async payout(input: PayoutInput, ctx: ProviderContext): Promise<PayoutResult> {
    const body = {
      payoutId: input.payoutId,
      driverId: input.driverId,
      amount: input.amount,
      currency: input.currency,
      destination: input.destination,
      merchantId: this.config.merchantId,
    };

    const res = await this.request<Record<string, unknown>>('POST', this.config.endpoints.payout, body, ctx);
    const providerRef = String(res.data['providerRef'] || res.data['reference'] || input.payoutId);
    const statusRaw = String(res.data['status'] || res.data['state'] || 'queued');
    const status = statusRaw.toLowerCase().includes('failed') ? 'failed' : statusRaw.toLowerCase().includes('settled') ? 'settled' : 'queued';

    return { providerRef, status };
  }

  webhookHandler(headers: Record<string, string | string[] | undefined>, payload: unknown): WebhookEvent {
    const signature = getHeader(headers, 'x-signature') || getHeader(headers, 'x-vodafone-signature') || '';
    const timestamp = getHeader(headers, 'x-timestamp') || '';
    const nonce = getHeader(headers, 'x-nonce') || '';
    const raw = JSON.stringify(payload ?? {});

    if (!signature || !timestamp || !nonce || !this.verifyWebhookSignature(raw, timestamp, nonce, signature)) {
      throw new Error('Invalid webhook signature.');
    }

    const body = payload as Record<string, unknown>;
    const eventId = String(body['eventId'] || body['event_id'] || body['id'] || '');
    const intentId = String(body['intentId'] || body['intent_id'] || body['reference'] || '');
    const status = mapVerifyStatus(String(body['status'] || body['state'] || 'failed'));
    const providerRef = String(body['providerRef'] || body['reference'] || body['transactionId'] || '');

    if (!eventId || !intentId) throw new Error('Invalid webhook payload.');

    return {
      eventId,
      intentId,
      status,
      providerRef,
      amount: body['amount'] ? Number(body['amount']) : undefined,
      currency: body['currency'] ? String(body['currency']) : undefined,
      riderId: body['riderId'] ? String(body['riderId']) : undefined,
      driverId: body['driverId'] ? String(body['driverId']) : undefined,
      timestamp: body['timestamp'] ? String(body['timestamp']) : undefined,
    };
  }

  async healthCheck(): Promise<'ok' | 'degraded' | 'down'> {
    if (!this.config.baseUrl) return 'down';
    return 'ok';
  }
}
