import { normalizeGhanaPhone } from './phone';

describe('normalizeGhanaPhone', () => {
  it('normalizes local format to +233', () => {
    expect(normalizeGhanaPhone('0241234567')).toBe('+233241234567');
  });

  it('keeps +233 format', () => {
    expect(normalizeGhanaPhone('+233241234567')).toBe('+233241234567');
  });
});
