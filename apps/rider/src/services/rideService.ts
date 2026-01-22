import type { RideRequestPayload, RideResponse, RideStatusResponse } from '@movegh/types';
import { request } from './apiClient';

export const requestRide = (payload: RideRequestPayload) =>
  request<RideResponse>('/rides/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getRideStatus = (rideId: string) =>
  request<RideStatusResponse>(`/rides/${rideId}`);
