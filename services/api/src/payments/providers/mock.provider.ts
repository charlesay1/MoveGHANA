import { Injectable } from '@nestjs/common';
import { config } from '../../config/config';
import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  MomoProvider,
  WebhookEvent,
} from './momo.provider.interface';

@Injectable()
export class MockProvider implements MomoProvider {
  name: 'mock' = 'mock';

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      providerRef: `mock_intent_${input.intentId}`,
      checkoutInstructions: `Dial *123# to approve GHS ${input.amount.toFixed(2)}.`,
    };
  }

  async confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    return {
      status: 'captured',
      providerRef: `mock_capture_${input.intentId}`,
    };
  }

  verifyWebhook(headers: Record<string, string | string[] | undefined>): boolean {
    const signature = headers['x-mock-signature'];
    const value = Array.isArray(signature) ? signature[0] : signature;
    return value === config.PAYMENTS_WEBHOOK_SECRET;
  }

  parseWebhook(payload: unknown): WebhookEvent {
    const body = payload as {
      eventId?: string;
      intentId?: string;
      status?: 'authorized' | 'captured' | 'failed';
      providerRef?: string;
      amount?: number;
      currency?: string;
      riderId?: string;
      driverId?: string;
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
    };
  }

  async healthCheck(): Promise<'ok' | 'degraded' | 'down'> {
    return 'ok';
  }
}
