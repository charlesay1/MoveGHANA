import { Injectable } from '@nestjs/common';
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
import { loadProviderConfig } from './provider.config';

@Injectable()
export class MockProvider implements PaymentProvider {
  name: 'mock' = 'mock';

  async initiatePayment(input: InitiatePaymentInput, _ctx: ProviderContext): Promise<InitiatePaymentResult> {
    return {
      providerRef: `mock_intent_${input.intentId}`,
      checkoutInstructions: `Dial *123# to approve GHS ${input.amount.toFixed(2)}.`,
      status: 'created',
    };
  }

  async verifyPayment(input: VerifyPaymentInput, _ctx: ProviderContext): Promise<VerifyPaymentResult> {
    return {
      status: 'captured',
      providerRef: input.providerRef || `mock_capture_${input.intentId}`,
    };
  }

  async refund(input: RefundInput, _ctx: ProviderContext): Promise<RefundResult> {
    return {
      status: 'settled',
      providerRef: `mock_refund_${input.intentId}`,
    };
  }

  async payout(input: PayoutInput, _ctx: ProviderContext): Promise<PayoutResult> {
    return {
      status: 'queued',
      providerRef: `mock_payout_${input.payoutId}`,
    };
  }

  webhookHandler(headers: Record<string, string | string[] | undefined>, payload: unknown): WebhookEvent {
    const cfg = loadProviderConfig('mock');
    const signature = headers['x-mock-signature'];
    const value = Array.isArray(signature) ? signature[0] : signature;
    if (value !== cfg.webhookSecret) throw new Error('Invalid webhook signature.');

    const body = payload as {
      eventId?: string;
      intentId?: string;
      status?: 'authorized' | 'captured' | 'failed';
      providerRef?: string;
      amount?: number;
      currency?: string;
      riderId?: string;
      driverId?: string;
      timestamp?: string;
    };

    if (!body?.eventId || !body.intentId || !body.status) {
      throw new Error('Invalid webhook payload.');
    }

    return {
      eventId: body.eventId,
      intentId: body.intentId,
      status: body.status,
      providerRef: body.providerRef,
      amount: body.amount,
      currency: body.currency,
      riderId: body.riderId,
      driverId: body.driverId,
      timestamp: body.timestamp,
    };
  }

  async healthCheck(): Promise<'ok' | 'degraded' | 'down'> {
    return 'ok';
  }
}
