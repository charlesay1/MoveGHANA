import { buildWebhookIdempotencyKey } from './webhook.util';

describe('buildWebhookIdempotencyKey', () => {
  it('returns deterministic idempotency key for webhook events', () => {
    const key1 = buildWebhookIdempotencyKey('mtn', 'evt_123');
    const key2 = buildWebhookIdempotencyKey('mtn', 'evt_123');
    const key3 = buildWebhookIdempotencyKey('vodafone', 'evt_123');
    expect(key1).toBe('webhook:mtn:evt_123');
    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });
});
