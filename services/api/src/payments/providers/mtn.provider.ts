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
export class MtnProvider implements MomoProvider {
  name: 'mtn' = 'mtn';

  async initiatePayment(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!config.MTN_MOMO_API_KEY || !config.MTN_MOMO_API_SECRET) {
      throw new Error('MTN MoMo is not configured.');
    }
    throw new Error('MTN MoMo provider not implemented.');
  }

  async confirmPayment(_input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    if (!config.MTN_MOMO_API_KEY || !config.MTN_MOMO_API_SECRET) {
      throw new Error('MTN MoMo is not configured.');
    }
    throw new Error('MTN MoMo provider not implemented.');
  }

  verifyWebhook(_headers: Record<string, string | string[] | undefined>, _payload: unknown): boolean {
    return false;
  }

  parseWebhook(_payload: unknown): WebhookEvent {
    throw new Error('MTN MoMo webhook parsing not implemented.');
  }

  async healthCheck(): Promise<'ok' | 'degraded' | 'down'> {
    if (!config.MTN_MOMO_API_KEY || !config.MTN_MOMO_API_SECRET) return 'degraded';
    return 'degraded';
  }
}
