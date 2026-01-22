import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useLocation } from '../context/LocationProvider';
import { useBooking } from '../context/BookingProvider';
import { Screen } from '../components/Screen';

type Props = { onWhereTo: () => void };

export const HomeMapScreen: React.FC<Props> = ({ onWhereTo }) => {
  const { coords, startTracking } = useLocation();
  const { setPickup, recentLocations, clearRecents, addRecent, setDestination } = useBooking();
  const [sheetOpen, setSheetOpen] = useState(false);
  const translateY = useRef(new Animated.Value(260)).current;

  useEffect(() => {
    startTracking();
  }, [startTracking]);

  useEffect(() => {
    if (coords) {
      setPickup({ label: 'Current location', latitude: coords.latitude, longitude: coords.longitude });
    }
  }, [coords, setPickup]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: sheetOpen ? 0 : 260,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [sheetOpen, translateY]);

  return (
    <Screen>
      <Text style={styles.title}>Good evening</Text>
      <TextInput
        style={styles.whereTo}
        placeholder="Where to?"
        placeholderTextColor={colors.slate}
        onFocus={() => setSheetOpen(true)}
        showSoftInputOnFocus={false}
      />
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
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Recent destinations</Text>
          <TouchableOpacity onPress={() => clearRecents()}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
        {recentLocations.length === 0 && (
          <Text style={styles.emptyText}>No recent destinations yet.</Text>
        )}
        {recentLocations.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.recentItem}
            onPress={() => {
              setDestination({
                label: item.name,
                latitude: item.lat ?? 5.6037,
                longitude: item.lng ?? -0.187,
                regionId: item.regionId,
              });
              void addRecent(item);
              onWhereTo();
            }}
          >
            <Text style={styles.recentText}>{item.name}</Text>
            {item.category && <Text style={styles.recentMeta}>{item.category.replace('_', ' ')}</Text>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.searchButton} onPress={onWhereTo}>
          <Text style={styles.searchText}>Search destinations</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSheetOpen(false)}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
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
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  sheetHandle: {
    width: 48,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sheetTitle: { ...typography.bodyLg, color: colors.black },
  clearText: { color: colors.slate },
  emptyText: { color: colors.slate, marginBottom: 12 },
  recentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  recentText: { ...typography.bodyLg, color: colors.black },
  recentMeta: { color: colors.slate, fontSize: 12 },
  searchButton: {
    marginTop: 12,
    backgroundColor: colors.ghGreen,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  searchText: { color: colors.white, fontWeight: '700' },
  closeText: { marginTop: 8, textAlign: 'center', color: colors.slate },
});
