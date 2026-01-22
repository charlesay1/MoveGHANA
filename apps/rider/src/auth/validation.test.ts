import { describe, expect, it } from 'vitest';
import { isValidGhanaPhone, normalizeGhanaPhone } from '@movegh/utils';

describe('rider phone validation', () => {
  it('normalizes to +233', () => {
    expect(normalizeGhanaPhone('0241234567')).toBe('+233241234567');
  });

  it('accepts +233 format', () => {
    expect(isValidGhanaPhone('+233541234567')).toBe(true);
  });
});
