import type {
  AuthStartRequest,
  AuthStartResponse,
  AuthVerifyRequest,
  AuthVerifyResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserMeResponse,
} from '@movegh/types';

type ApiConfig = {
  baseUrl: string;
  getToken?: () => string | undefined | null;
};

export const createApiClient = (config: ApiConfig) => {
  const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const token = config.getToken?.();
    const res = await fetch(`${config.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message || `API error ${res.status}`);
      }
      const text = await res.text();
      throw new Error(text || `API error ${res.status}`);
    }
    return (await res.json()) as T;
  };

  return {
    authStart: (phone: AuthStartRequest['phone']) =>
      request<AuthStartResponse>(`/auth/start`, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
    authVerify: (requestId: AuthVerifyRequest['requestId'], code: AuthVerifyRequest['code']) =>
      request<AuthVerifyResponse>(`/auth/verify`, {
        method: 'POST',
        body: JSON.stringify({ requestId, code }),
      }),
    me: () => request<UserMeResponse>(`/users/me`),
    updateProfile: (payload: UpdateProfileRequest) =>
      request<UpdateProfileResponse>(`/users/profile`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  };
};
