import type { AuthStartRequest, AuthStartResponse, AuthVerifyRequest, AuthVerifyResponse } from '@movegh/types';
import { request } from './client';

export const authStart = (payload: AuthStartRequest) =>
  request<AuthStartResponse>('/auth/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const authVerify = (payload: AuthVerifyRequest) =>
  request<AuthVerifyResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
