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
export class AirtelTigoProvider implements MomoProvider {
  name: 'airteltigo' = 'airteltigo';

  async initiatePayment(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!config.AIRTELTIGO_MOMO_API_KEY || !config.AIRTELTIGO_MOMO_API_SECRET) {
      throw new Error('AirtelTigo Money is not configured.');
    }
    throw new Error('AirtelTigo Money provider not implemented.');
  }

  async confirmPayment(_input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    if (!config.AIRTELTIGO_MOMO_API_KEY || !config.AIRTELTIGO_MOMO_API_SECRET) {
      throw new Error('AirtelTigo Money is not configured.');
    }
    throw new Error('AirtelTigo Money provider not implemented.');
  }

  verifyWebhook(_headers: Record<string, string | string[] | undefined>, _payload: unknown): boolean {
    return false;
  }

  parseWebhook(_payload: unknown): WebhookEvent {
    throw new Error('AirtelTigo Money webhook parsing not implemented.');
  }

  async healthCheck(): Promise<'ok' | 'degraded' | 'down'> {
    if (!config.AIRTELTIGO_MOMO_API_KEY || !config.AIRTELTIGO_MOMO_API_SECRET) return 'degraded';
    return 'degraded';
  }
}
