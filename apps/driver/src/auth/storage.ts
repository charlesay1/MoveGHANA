import * as SecureStore from 'expo-secure-store';
import type { AuthState } from './types';
import { initialAuthState } from './machine';

const AUTH_KEY = 'movegh_driver_auth';

export const loadAuthState = async (): Promise<AuthState> => {
  try {
    const stored = await SecureStore.getItemAsync(AUTH_KEY);
    if (!stored) return initialAuthState;
    return JSON.parse(stored) as AuthState;
  } catch {
    return initialAuthState;
  }
};

export const saveAuthState = async (state: AuthState) => {
  try {
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};
