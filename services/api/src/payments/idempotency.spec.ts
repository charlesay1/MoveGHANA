import { normalizeIdempotencyKey } from './idempotency';

describe('normalizeIdempotencyKey', () => {
  it('returns null for empty values', () => {
    expect(normalizeIdempotencyKey(undefined)).toBeNull();
    expect(normalizeIdempotencyKey('')).toBeNull();
    expect(normalizeIdempotencyKey('   ')).toBeNull();
  });

  it('trims and returns a key', () => {
    expect(normalizeIdempotencyKey('  key-123 ')).toBe('key-123');
  });
});
