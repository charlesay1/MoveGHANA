import { describe, expect, it } from 'vitest';
import { authReducer, initialAuthState } from './machine';

it('moves through steps', () => {
  const state1 = authReducer(initialAuthState, { type: 'NEXT', next: 'phone' });
  expect(state1.step).toBe('phone');
  const state2 = authReducer(state1, { type: 'NEXT', next: 'otp' });
  expect(state2.step).toBe('otp');
});
