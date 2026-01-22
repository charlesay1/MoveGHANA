import { Injectable } from '@nestjs/common';
import type { FareEstimateRequest, FareEstimateResponse, RegionTier, TransportMode } from '@movegh/types';
import data from '../../../locations/ghana-landmarks.json';

const VEHICLE_MULTIPLIER: Record<TransportMode, number> = {
  car: 1.0,
  motorbike: 0.7,
  pragya: 0.8,
  aboboyaa: 0.9,
};

const REGION_MULTIPLIER: Record<RegionTier | 'default', number> = {
  metro: 1.2,
  urban: 1.05,
  rural: 0.9,
  default: 1.0,
};

@Injectable()
export class FareService {
  estimate(payload: FareEstimateRequest): FareEstimateResponse {
    const distanceKm = payload.distanceKm ?? calcDistanceKm(
      payload.pickup.lat,
      payload.pickup.lng,
      payload.destination.lat,
      payload.destination.lng,
    );

    const regionTier = resolveRegionTier(payload.regionId);
    const regionMultiplier = REGION_MULTIPLIER[regionTier];
    const vehicleMultiplier = VEHICLE_MULTIPLIER[payload.mode];

    const baseFare = 4.0;
    const distanceFare = Number((distanceKm * 2.1).toFixed(2));
    const subtotal = baseFare + distanceFare;
    const total = Number((subtotal * regionMultiplier * vehicleMultiplier).toFixed(2));

    return {
      currency: 'GHS',
      distanceKm: Number(distanceKm.toFixed(2)),
      regionId: payload.regionId || 'unknown',
      mode: payload.mode,
      breakdown: {
        baseFare,
        distanceFare,
        regionMultiplier,
        vehicleMultiplier,
        total,
      },
      total,
    };
  }
}

const resolveRegionTier = (regionId?: string): RegionTier | 'default' => {
  if (!regionId) return 'default';
  const region = data.regions.find((item) => item.id === regionId);
  return region?.tier || 'default';
};

const calcDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number) => (value * Math.PI) / 180;
