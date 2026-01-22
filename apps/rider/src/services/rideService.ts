import type { RideEstimate, RideRequestPayload, RideResponse, RideStatusResponse } from '@movegh/types';
import { request } from './apiClient';

export const requestRide = (payload: RideRequestPayload) =>
  request<RideResponse>('/rides/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getRideStatus = (rideId: string) =>
  request<RideStatusResponse>(`/rides/${rideId}`);

export const estimateFare = (distanceKm: number, mode: RideRequestPayload['mode']): RideEstimate => {
  const base = {
    car: 5,
    motorbike: 3,
    pragya: 2.5,
    aboboyaa: 2,
  }[mode];

  const perKm = {
    car: 2.2,
    motorbike: 1.6,
    pragya: 1.3,
    aboboyaa: 1.1,
  }[mode];

  const price = Math.max(5, base + distanceKm * perKm);
  const etaMinutes = Math.max(4, Math.round(distanceKm * 3));

  return { price: Number(price.toFixed(2)), etaMinutes };
};
