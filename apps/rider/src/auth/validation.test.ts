import { describe, expect, it } from 'vitest';
import { isValidGhanaPhone, isValidOtp, normalizeGhanaPhone } from '@movegh/utils';

describe('rider validation helpers', () => {
  it('normalizes Ghana phone numbers', () => {
    expect(normalizeGhanaPhone('0241234567')).toBe('+233241234567');
    expect(normalizeGhanaPhone('+233541234567')).toBe('+233541234567');
  });

  it('validates 6-digit OTP', () => {
    expect(isValidOtp('123456', 6)).toBe(true);
    expect(isValidOtp('12345', 6)).toBe(false);
    expect(isValidOtp('abcdef', 6)).toBe(false);
  });

  it('validates Ghana phone format', () => {
    expect(isValidGhanaPhone('0241234567')).toBe(true);
    expect(isValidGhanaPhone('0311234567')).toBe(false);
  });
});
