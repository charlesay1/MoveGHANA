import type { UpdateProfileRequest, UpdateProfileResponse, UserMeResponse } from '@movegh/types';
import { request } from './client';

export const getMe = () => request<UserMeResponse>('/users/me');

export const updateProfile = (payload: UpdateProfileRequest) =>
  request<UpdateProfileResponse>('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const healthCheck = () => request<{ status: string }>('/health');
