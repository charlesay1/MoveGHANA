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
export class VodafoneProvider implements MomoProvider {
  name: 'vodafone' = 'vodafone';

  async initiatePayment(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!config.VODAFONE_MOMO_API_KEY || !config.VODAFONE_MOMO_API_SECRET) {
      throw new Error('Vodafone Cash is not configured.');
    }
    throw new Error('Vodafone Cash provider not implemented.');
  }

  async confirmPayment(_input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    if (!config.VODAFONE_MOMO_API_KEY || !config.VODAFONE_MOMO_API_SECRET) {
      throw new Error('Vodafone Cash is not configured.');
    }
    throw new Error('Vodafone Cash provider not implemented.');
  }

  verifyWebhook(_headers: Record<string, string | string[] | undefined>, _payload: unknown): boolean {
    return false;
  }

  parseWebhook(_payload: unknown): WebhookEvent {
    throw new Error('Vodafone Cash webhook parsing not implemented.');
  }

  async healthCheck(): Promise<'ok' | 'degraded' | 'down'> {
    if (!config.VODAFONE_MOMO_API_KEY || !config.VODAFONE_MOMO_API_SECRET) return 'degraded';
    return 'degraded';
  }
}
