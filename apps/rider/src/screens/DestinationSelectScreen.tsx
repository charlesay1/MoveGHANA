import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useLocation } from '../context/LocationProvider';
import { useToast } from '../context/ToastProvider';
import { useBooking } from '../context/BookingProvider';
import { Screen } from '../components/Screen';
import { PrimaryButton } from '../components/PrimaryButton';

export const DestinationSelectScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({
  onNext,
  onBack,
}) => {
  const { setDestination, destination } = useBooking();
  const { lookupLandmarks } = useLocation();
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; lat?: number; lng?: number }[]>([]);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let active = true;
    lookupLandmarks(query)
      .then((data) => {
        if (active) setResults(data);
      })
      .catch((err) => {
        show(err instanceof Error ? err.message : 'Unable to load landmarks.', 'error');
      });
    return () => {
      active = false;
    };
  }, [query, lookupLandmarks, show]);

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
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No landmarks found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              setDestination({
                label: item.name,
                latitude: item.lat ?? 5.6037,
                longitude: item.lng ?? -0.187,
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
          </TouchableOpacity>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton label="Confirm destination" onPress={onNext} disabled={!destination} />
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
  item: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  itemText: { ...typography.bodyLg, color: colors.black },
  empty: { color: colors.slate, marginTop: 8 },
  footer: { marginTop: 12 },
  back: { marginTop: 8 },
  backText: { color: colors.slate },
});
