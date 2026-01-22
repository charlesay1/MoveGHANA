import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { RideRequestPayload, RideResponse, RideStatusResponse, TransportMode } from '@movegh/types';
import { estimateFare, getRideStatus, requestRide } from '../services/rideService';
import { calculateDistanceKm } from '../utils/geo';

export type BookingState = {
  pickup?: { label: string; latitude: number; longitude: number };
  destination?: { label: string; latitude: number; longitude: number };
  distanceKm: number;
  mode?: TransportMode;
  fare?: { price: number; etaMinutes: number };
  ride?: RideResponse;
  status?: RideStatusResponse;
  searching: boolean;
  error?: string;
};

type BookingContextValue = BookingState & {
  setPickup: (pickup: BookingState['pickup']) => void;
  setDestination: (destination: BookingState['destination']) => void;
  setMode: (mode: TransportMode) => void;
  request: () => Promise<void>;
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
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pickup && destination) {
      const dist = calculateDistanceKm(
        pickup.latitude,
        pickup.longitude,
        destination.latitude,
        destination.longitude,
      );
      setDistanceKm(dist);
      if (mode) setFare(estimateFare(dist, mode));
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
        fare: fare.price,
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
        setPickup,
        setDestination,
        setMode,
        request,
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
