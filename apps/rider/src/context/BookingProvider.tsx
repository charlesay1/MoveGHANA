import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type {
  FareEstimateResponse,
  RideRequestPayload,
  RideResponse,
  RideStatusResponse,
  TransportMode,
} from '@movegh/types';
import { estimateFare as estimateFareApi } from '../services/fareService';
import { getRideStatus, requestRide } from '../services/rideService';
import { calculateDistanceKm } from '../utils/geo';
import {
  clearRecentLocations,
  loadRecentLocations,
  saveRecentLocation,
  type RecentLocation,
} from '../services/landmarkSearchService';

export type BookingState = {
  pickup?: { label: string; latitude: number; longitude: number; regionId?: string };
  destination?: { label: string; latitude: number; longitude: number; regionId?: string };
  distanceKm: number;
  mode?: TransportMode;
  fare?: FareEstimateResponse;
  ride?: RideResponse;
  status?: RideStatusResponse;
  searching: boolean;
  error?: string;
  recentLocations: RecentLocation[];
};

type BookingContextValue = BookingState & {
  setPickup: (pickup: BookingState['pickup']) => void;
  setDestination: (destination: BookingState['destination']) => void;
  setMode: (mode: TransportMode) => void;
  request: () => Promise<void>;
  addRecent: (location: RecentLocation) => Promise<void>;
  clearRecents: () => Promise<void>;
  reset: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export const BookingProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [pickup, setPickup] = useState<BookingState['pickup']>(undefined);
  const [destination, setDestination] = useState<BookingState['destination']>(undefined);
  const [distanceKm, setDistanceKm] = useState(0);
  const [mode, setMode] = useState<TransportMode | undefined>(undefined);
  const [fare, setFare] = useState<BookingState['fare']>(undefined);
  const [ride, setRide] = useState<RideResponse | undefined>(undefined);
  const [status, setStatus] = useState<RideStatusResponse | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadRecentLocations().then(setRecentLocations);
  }, []);

  useEffect(() => {
    if (pickup && destination) {
      const dist = calculateDistanceKm(
        pickup.latitude,
        pickup.longitude,
        destination.latitude,
        destination.longitude,
      );
      setDistanceKm(dist);
      if (mode) {
        estimateFareApi({
          pickup: { lat: pickup.latitude, lng: pickup.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
          mode,
          regionId: destination.regionId || pickup.regionId,
          distanceKm: dist,
        })
          .then(setFare)
          .catch(() => {
            setFare({
              currency: 'GHS',
              distanceKm: dist,
              regionId: destination.regionId || pickup.regionId || 'unknown',
              mode,
              breakdown: {
                baseFare: 4,
                distanceFare: Number((dist * 2.1).toFixed(2)),
                regionMultiplier: 1,
                vehicleMultiplier: 1,
                total: Number((4 + dist * 2.1).toFixed(2)),
              },
              total: Number((4 + dist * 2.1).toFixed(2)),
            });
          });
      }
    } else {
      setDistanceKm(0);
      setFare(undefined);
    }
  }, [pickup, destination, mode]);

  useEffect(() => {
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  };

  const request = async () => {
    if (!pickup || !destination || !mode || !fare || searching) return;
    stopPolling();
    setSearching(true);
    setError(undefined);
    try {
      const payload: RideRequestPayload = {
        pickup: { label: pickup.label, lat: pickup.latitude, lng: pickup.longitude },
        dropoff: { label: destination.label, lat: destination.latitude, lng: destination.longitude },
        mode,
        distanceKm,
        fare: fare.total,
      };
      const res = await requestRide(payload);
      setRide(res);
      setStatus(res);
      setSearching(false);

      let attempts = 0;
      pollerRef.current = setInterval(async () => {
        if (!res.rideId || attempts > 10) {
          stopPolling();
          return;
        }
        try {
          const updated = await getRideStatus(res.rideId);
          setStatus(updated);
          if (updated.status !== 'searching') {
            stopPolling();
          }
          attempts += 1;
        } catch (pollError) {
          setError(pollError instanceof Error ? pollError.message : 'Unable to refresh ride status.');
          stopPolling();
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request ride.');
      setSearching(false);
    }
  };

  const reset = () => {
    stopPolling();
    setDestination(undefined);
    setMode(undefined);
    setFare(undefined);
    setRide(undefined);
    setStatus(undefined);
    setSearching(false);
  };

  const addRecent = async (location: RecentLocation) => {
    const next = await saveRecentLocation(location);
    setRecentLocations(next);
  };

  const clearRecents = async () => {
    await clearRecentLocations();
    setRecentLocations([]);
  };

  return (
    <BookingContext.Provider
      value={{
        pickup,
        destination,
        distanceKm,
        mode,
        fare,
        ride,
        status,
        searching,
        error,
        recentLocations,
        setPickup,
        setDestination,
        setMode,
        request,
        addRecent,
        clearRecents,
        reset,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
};
