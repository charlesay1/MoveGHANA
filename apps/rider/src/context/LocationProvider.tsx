import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type LocationState = {
  status: Location.PermissionStatus | 'undetermined';
  coords?: { latitude: number; longitude: number };
  error?: string;
  loading: boolean;
};

type LocationContextValue = LocationState & {
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export const LocationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [status, setStatus] = useState<LocationState['status']>('undetermined');
  const [coords, setCoords] = useState<LocationState['coords']>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = async () => {
    setLoading(true);
    setError(undefined);
    const { status: result } = await Location.requestForegroundPermissionsAsync();
    setStatus(result);
    setLoading(false);
    return result === 'granted';
  };

  const refreshLocation = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const location = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to get location.');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    if (watcher.current) return;
    const granted = status === 'granted' ? true : await requestPermission();
    if (!granted) return;
    await refreshLocation();
    watcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 10 },
      (loc) => {
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      },
    );
  };

  const stopTracking = () => {
    watcher.current?.remove();
    watcher.current = null;
  };


  useEffect(() => {
    Location.getForegroundPermissionsAsync().then((result) => {
      setStatus(result.status);
    });
    return () => stopTracking();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        status,
        coords,
        error,
        loading,
        requestPermission,
        refreshLocation,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};
