import * as SecureStore from 'expo-secure-store';
import type { AuthState } from './types';

const TOKEN_KEY = 'movegh_rider_token';
const USER_KEY = 'movegh_rider_user';
const LOCATION_KEY = 'movegh_rider_location_ready';

export const loadToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveToken = async (token?: string) => {
  if (!token) return;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const saveUser = async (user?: AuthState['user']) => {
  if (!user) return;
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const loadUser = async (): Promise<AuthState['user'] | null> => {
  try {
    const stored = await SecureStore.getItemAsync(USER_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AuthState['user'];
  } catch {
    return null;
  }
};

export const saveLocationReady = async (value: boolean) => {
  try {
    await SecureStore.setItemAsync(LOCATION_KEY, value ? '1' : '0');
  } catch {
    // ignore
  }
};

export const loadLocationReady = async (): Promise<boolean> => {
  try {
    const stored = await SecureStore.getItemAsync(LOCATION_KEY);
    return stored === '1';
  } catch {
    return false;
  }
};

export const clearSession = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(LOCATION_KEY);
  } catch {
    // ignore
  }
};
