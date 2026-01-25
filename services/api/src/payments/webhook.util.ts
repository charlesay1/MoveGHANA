import type { ProviderName } from '../modules/payments/providers/provider.interface';

export const buildWebhookIdempotencyKey = (provider: ProviderName, eventId: string) => {
  return `webhook:${provider}:${eventId}`;
};
