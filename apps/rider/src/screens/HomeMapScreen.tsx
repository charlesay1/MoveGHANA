import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useLocation } from '../context/LocationProvider';
import { useBooking } from '../context/BookingProvider';
import { Screen } from '../components/Screen';

type Props = { onWhereTo: () => void };

export const HomeMapScreen: React.FC<Props> = ({ onWhereTo }) => {
  const { coords, startTracking } = useLocation();
  const { setPickup } = useBooking();

  useEffect(() => {
    startTracking();
  }, [startTracking]);

  useEffect(() => {
    if (coords) {
      setPickup({ label: 'Current location', latitude: coords.latitude, longitude: coords.longitude });
    }
  }, [coords, setPickup]);

  return (
    <Screen>
      <Text style={styles.title}>Good evening</Text>
      <TouchableOpacity style={styles.whereTo} onPress={onWhereTo}>
        <Text style={styles.whereText}>Where to?</Text>
      </TouchableOpacity>
      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          showsUserLocation
          region={
            coords
              ? {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04,
                }
              : undefined
          }
        >
          {coords && <Marker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }} />}
        </MapView>
        {!coords && <Text style={styles.mapHint}>Enable location to see your position.</Text>}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.black, marginBottom: 16 },
  whereTo: {
    backgroundColor: colors.mist,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  whereText: { ...typography.bodyLg, color: colors.slate },
  mapCard: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  map: { flex: 1 },
  mapHint: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    color: colors.slate,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 12,
    textAlign: 'center',
  },
});
