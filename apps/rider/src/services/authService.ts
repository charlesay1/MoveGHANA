import type { AuthStartRequest, AuthStartResponse, AuthVerifyRequest, AuthVerifyResponse } from '@movegh/types';
import { request } from './apiClient';

export const startAuth = (payload: AuthStartRequest) =>
  request<AuthStartResponse>('/auth/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyAuth = (payload: AuthVerifyRequest) =>
  request<AuthVerifyResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
