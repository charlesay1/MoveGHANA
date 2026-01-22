import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { decode as atob } from 'base-64';
import type { AuthStep, Profile } from '../auth/types';
import { authReducer, initialAuthState } from '../auth/machine';
import {
  clearSession,
  loadLocationReady,
  loadToken,
  loadUser,
  saveLocationReady,
  saveToken,
  saveUser,
} from '../auth/storage';
import { authStart, authVerify } from '../api/auth';
import { getMe, healthCheck, updateProfile as updateUserProfile } from '../api/user';
import { clearAuthToken, setAuthToken } from '../api/client';

type ApiStatus = 'unknown' | 'reachable' | 'unreachable';

type SessionContextValue = {
  state: typeof initialAuthState;
  loading: boolean;
  isOnline: boolean;
  apiStatus: ApiStatus;
  bannerMessage?: string;
  goTo: (step: AuthStep) => void;
  startAuth: (phone: string) => Promise<void>;
  verifyOtp: (requestId: string | undefined, code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  updateProfile: (profile: Profile) => Promise<void>;
  completeLocation: () => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('unknown');
  const [bannerMessage, setBannerMessage] = useState<string | undefined>(undefined);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAuthToken(state.token);
  }, [state.token]);

  useEffect(() => {
    const sub = NetInfo.addEventListener((info) => {
      setIsOnline(!!info.isConnected);
    });
    return () => sub();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await healthCheck();
        setApiStatus('reachable');
        setBannerMessage(undefined);
      } catch {
        setApiStatus('unreachable');
        setBannerMessage('Unable to reach API. Check your connection.');
      }

      const token = await loadToken();
      const locationReady = await loadLocationReady();
      const storedUser = await loadUser();
      if (token) {
        const expiry = getTokenExpiry(token);
        if (expiry && expiry <= Date.now()) {
          await performLogout();
          setLoading(false);
          return;
        }

        dispatch({ type: 'SET_TOKEN', token });
        dispatch({ type: 'SET_LOCATION_READY', value: locationReady });
        setAuthToken(token);
      }

      try {
        if (storedUser) {
          dispatch({ type: 'SET_USER', user: storedUser });
          dispatch({ type: 'SET_PHONE', phone: storedUser.phone });
          dispatch({ type: 'COMPLETE' });
          routeAfterAuth(storedUser, locationReady, dispatch);
        }

        if (token) {
          const me = await getMe();
          dispatch({ type: 'SET_USER', user: me });
          dispatch({ type: 'SET_PHONE', phone: me.phone });
          dispatch({ type: 'COMPLETE' });
          routeAfterAuth(me, locationReady, dispatch);
        }
      } catch (error) {
        if (isAuthError(error)) {
          await performLogout();
        } else if (storedUser) {
          dispatch({ type: 'COMPLETE' });
          routeAfterAuth(storedUser, locationReady, dispatch);
        } else {
          dispatch({ type: 'RESET' });
          dispatch({ type: 'NEXT', next: 'welcome' });
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (state.token) saveToken(state.token);
    if (state.user) saveUser(state.user);
    saveLocationReady(state.locationReady);
  }, [state]);

  useEffect(() => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (!state.token) return;
    const expiry = getTokenExpiry(state.token);
    if (!expiry) return;
    if (expiry <= Date.now()) {
      void performLogout();
      return;
    }
    logoutTimer.current = setTimeout(() => {
      setBannerMessage('Session expired. Please sign in again.');
      void performLogout();
    }, expiry - Date.now());
  }, [state.token]);

  const performLogout = async () => {
    clearAuthToken();
    await clearSession();
    dispatch({ type: 'RESET' });
    dispatch({ type: 'NEXT', next: 'welcome' });
  };

  const startAuth = async (phone: string) => {
    dispatch({ type: 'SET_PHONE', phone });
    const res = await authStart({ phone });
    dispatch({ type: 'SET_REQUEST_ID', requestId: res.requestId });
    dispatch({ type: 'NEXT', next: 'otp' });
  };

  const verifyOtp = async (requestId: string | undefined, code: string) => {
    if (!requestId) {
      throw new Error('Request expired. Please resend the code.');
    }
    dispatch({ type: 'SET_OTP', otp: code });
    const res = await authVerify({ requestId, code });
    setAuthToken(res.token);
    dispatch({ type: 'SET_TOKEN', token: res.token });
    const me = await getMe();
    dispatch({ type: 'SET_USER', user: me });
    dispatch({ type: 'COMPLETE' });
    routeAfterAuth(me, state.locationReady, dispatch);
  };

  const resendOtp = async () => {
    if (!state.phone) throw new Error('Enter a phone number first.');
    const res = await authStart({ phone: state.phone });
    dispatch({ type: 'SET_REQUEST_ID', requestId: res.requestId });
  };

  const updateProfile = async (profile: Profile) => {
    dispatch({ type: 'SET_PROFILE', profile });
    const updated = await updateUserProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    });
    dispatch({ type: 'SET_USER', user: updated });
    routeAfterAuth(updated, state.locationReady, dispatch);
  };

  const completeLocation = () => {
    dispatch({ type: 'SET_LOCATION_READY', value: true });
    dispatch({ type: 'NEXT', next: 'home' });
  };

  const logout = () => {
    void performLogout();
  };

  const value: SessionContextValue = {
    state,
    loading,
    isOnline,
    apiStatus,
    bannerMessage,
    goTo: (step) => dispatch({ type: 'NEXT', next: step }),
    startAuth,
    verifyOtp,
    resendOtp,
    updateProfile,
    completeLocation,
    logout,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};

const routeAfterAuth = (
  user: { firstName?: string },
  locationReady: boolean,
  dispatch: React.Dispatch<{ type: 'NEXT'; next: AuthStep }>,
) => {
  if (!user.firstName) {
    dispatch({ type: 'NEXT', next: 'profile' });
  } else if (!locationReady) {
    dispatch({ type: 'NEXT', next: 'location' });
  } else {
    dispatch({ type: 'NEXT', next: 'home' });
  }
};

const isAuthError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('invalid') || message.includes('expired') || message.includes('authorization');
};

const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};
