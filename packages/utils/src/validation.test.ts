import { describe, expect, it } from 'vitest';
import { isValidGhanaPhone, isValidOtp, normalizeGhanaPhone } from './validation';

describe('phone validation', () => {
  it('normalizes +233 to +233 format', () => {
    expect(normalizeGhanaPhone('+233241234567')).toBe('+233241234567');
  });

  it('accepts valid MTN range', () => {
    expect(isValidGhanaPhone('0241234567')).toBe(true);
    expect(isValidGhanaPhone('+233541234567')).toBe(true);
    expect(isValidGhanaPhone('233541234567')).toBe(true);
  });

  it('rejects invalid length', () => {
    expect(isValidGhanaPhone('02412345')).toBe(false);
  });

  it('rejects unknown prefix', () => {
    expect(isValidGhanaPhone('0311234567')).toBe(false);
  });
});

describe('otp validation', () => {
  it('accepts 6 digits', () => {
    expect(isValidOtp('123456')).toBe(true);
  });

  it('rejects non-numeric', () => {
    expect(isValidOtp('12a456')).toBe(false);
  });
});
