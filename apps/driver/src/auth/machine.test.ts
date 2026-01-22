import { describe, expect, it } from 'vitest';
import { authReducer, initialAuthState } from './machine';

describe('driver auth reducer', () => {
  it('moves to phone', () => {
    const state = authReducer(initialAuthState, { type: 'NEXT', next: 'phone' });
    expect(state.step).toBe('phone');
  });
});
