import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useToast } from '../context/ToastProvider';
import { useBooking } from '../context/BookingProvider';
import { Screen } from '../components/Screen';
import { PrimaryButton } from '../components/PrimaryButton';
import type { Landmark, LandmarkCategory } from '@movegh/types';
import { searchLandmarks } from '../services/landmarkSearchService';

export const DestinationSelectScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({
  onNext,
  onBack,
}) => {
  const { setDestination, destination, addRecent, recentLocations, clearRecents } = useBooking();
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LandmarkCategory | undefined>(undefined);
  const [regionId, setRegionId] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchLandmarks({ query, category, regionId, limit: 20 })
      .then((data) => {
        if (active) setResults(data);
      })
      .catch((err) => {
        show(err instanceof Error ? err.message : 'Unable to load landmarks.', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, category, regionId, show]);

  return (
    <Screen>
      <Text style={styles.title}>Select destination</Text>
      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 5.6037,
            longitude: -0.187,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          onLongPress={(event: MapPressEvent) => {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            setPin({ latitude, longitude });
            setDestination({ label: 'Pinned location', latitude, longitude });
          }}
        >
          {pin && <Marker coordinate={pin} />}
        </MapView>
      </View>
      <Text style={styles.caption}>Tip: long-press the map to drop a pin.</Text>
      <TextInput
        style={styles.input}
        placeholder="Search landmarks"
        value={query}
        onChangeText={setQuery}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {categories.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setCategory(item.key === category ? undefined : item.key)}
            style={[styles.filterChip, item.key === category && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, item.key === category && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {regions.map((item) => {
          const active = item.id === 'all' ? !regionId : regionId === item.id;
          return (
          <Pressable
            key={item.id}
            onPress={() => setRegionId(item.id === 'all' ? undefined : item.id)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
          </Pressable>
        );})}
      </ScrollView>
      {!!recentLocations.length && !query && (
        <View style={styles.recents}>
          <View style={styles.recentsHeader}>
            <Text style={styles.recentsTitle}>Recent destinations</Text>
            <Pressable onPress={() => clearRecents()}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
          {recentLocations.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => {
                setDestination({
                  label: item.name,
                  latitude: item.lat ?? 5.6037,
                  longitude: item.lng ?? -0.187,
                  regionId: item.regionId,
                });
                setPin(
                  item.lat && item.lng
                    ? { latitude: item.lat, longitude: item.lng }
                    : { latitude: 5.6037, longitude: -0.187 },
                );
                onNext();
              }}
            >
              <Text style={styles.itemText}>{item.name}</Text>
              {item.category && <Text style={styles.meta}>{item.category.replace('_', ' ')}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading ? <ActivityIndicator /> : <Text style={styles.empty}>No landmarks found.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              setDestination({
                label: item.name,
                latitude: item.lat ?? 5.6037,
                longitude: item.lng ?? -0.187,
                regionId: item.regionId,
              });
              setPin(
                item.lat && item.lng
                  ? { latitude: item.lat, longitude: item.lng }
                  : { latitude: 5.6037, longitude: -0.187 },
              );
              void addRecent({
                id: item.id,
                name: item.name,
                category: item.category,
                regionId: item.regionId,
                lat: item.lat,
                lng: item.lng,
              });
              onNext();
            }}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            {item.category && <Text style={styles.meta}>{item.category.replace('_', ' ')}</Text>}
          </TouchableOpacity>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton
          label="Confirm destination"
          onPress={() => {
            if (destination) {
              void addRecent({
                id: destination.label,
                name: destination.label,
                lat: destination.latitude,
                lng: destination.longitude,
                regionId: destination.regionId,
              });
            }
            onNext();
          }}
          disabled={!destination}
        />
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.black, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  mapCard: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  map: { flex: 1 },
  caption: { color: colors.slate, marginBottom: 8 },
  filterRow: { marginBottom: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#ECF7F1', borderColor: colors.ghGreen },
  filterText: { color: colors.slate, fontSize: 12 },
  filterTextActive: { color: colors.ghGreen, fontWeight: '600' },
  recents: { marginBottom: 12 },
  recentsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  recentsTitle: { ...typography.bodyLg, color: colors.black },
  clearText: { color: colors.slate },
  item: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  itemText: { ...typography.bodyLg, color: colors.black },
  meta: { color: colors.slate, marginTop: 4 },
  empty: { color: colors.slate, marginTop: 8 },
  footer: { marginTop: 12 },
  back: { marginTop: 8 },
  backText: { color: colors.slate },
});

const categories: { key: LandmarkCategory; label: string }[] = [
  { key: 'market', label: 'Markets' },
  { key: 'junction', label: 'Junctions' },
  { key: 'church', label: 'Churches' },
  { key: 'lorry_station', label: 'Lorry Stations' },
  { key: 'mall', label: 'Malls' },
  { key: 'hospital', label: 'Hospitals' },
  { key: 'school', label: 'Schools' },
  { key: 'government', label: 'Govt' },
];

const regions = [
  { id: 'all', label: 'All regions' },
  { id: 'greater_accra', label: 'Accra' },
  { id: 'ashanti', label: 'Ashanti' },
  { id: 'central', label: 'Central' },
  { id: 'eastern', label: 'Eastern' },
  { id: 'northern', label: 'Northern' },
  { id: 'upper_east', label: 'Upper East' },
  { id: 'upper_west', label: 'Upper West' },
];
