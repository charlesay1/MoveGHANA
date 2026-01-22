import type { FareEstimateRequest, FareEstimateResponse } from '@movegh/types';
import { request } from './apiClient';

export const estimateFare = (payload: FareEstimateRequest) =>
  request<FareEstimateResponse>('/fare/estimate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
