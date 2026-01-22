import { Injectable, NotFoundException } from '@nestjs/common';
import type { RideRequestPayload, RideResponse } from '@movegh/types';

@Injectable()
export class RidesService {
  private readonly rides = new Map<
    string,
    RideResponse & { createdAt: number; riderId: string }
  >();

  createRide(payload: RideRequestPayload, riderId: string): RideResponse {
    const rideId = `ride_${this.rides.size + 1}`;
    const etaMinutes = Math.max(4, Math.round(payload.distanceKm * 3));
    const ride: RideResponse & { createdAt: number; riderId: string } = {
      rideId,
      status: 'searching',
      etaMinutes,
      fare: payload.fare,
      mode: payload.mode,
      createdAt: Date.now(),
      riderId,
    };
    this.rides.set(rideId, ride);
    return ride;
  }

  getRide(rideId: string): RideResponse {
    const ride = this.rides.get(rideId);
    if (!ride) throw new NotFoundException('Ride not found');

    if (ride.status === 'searching' && Date.now() - ride.createdAt > 10000) {
      ride.status = 'matched';
    }

    return {
      rideId: ride.rideId,
      status: ride.status,
      etaMinutes: ride.etaMinutes,
      fare: ride.fare,
      mode: ride.mode,
    };
  }
}
