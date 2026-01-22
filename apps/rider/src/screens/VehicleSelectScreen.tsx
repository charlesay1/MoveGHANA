import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useBooking } from '../context/BookingProvider';
import type { TransportMode } from '@movegh/types';
import { Screen } from '../components/Screen';

const modes: { key: TransportMode; label: string }[] = [
  { key: 'car', label: 'Car' },
  { key: 'motorbike', label: 'Motorbike' },
  { key: 'pragya', label: 'Pragya' },
  { key: 'aboboyaa', label: 'Aboboyaa' },
];

export const VehicleSelectScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({
  onNext,
  onBack,
}) => {
  const { mode, distanceKm, setMode, fare } = useBooking();

  return (
    <Screen>
      <Text style={styles.title}>Choose a vehicle</Text>
      <Text style={styles.subtitle}>Distance: {distanceKm.toFixed(1)} km</Text>
      <FlatList
        data={modes}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, mode === item.key && styles.active]}
            onPress={() => setMode(item.key)}
          >
            <Text style={styles.itemText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.price}>Est. fare: GHS {fare?.price?.toFixed(2) ?? '--'}</Text>
        <Text style={styles.eta}>ETA: {fare?.etaMinutes ? `${fare.etaMinutes} min` : '--'}</Text>
        <TouchableOpacity style={[styles.cta, !mode && styles.ctaDisabled]} onPress={onNext} disabled={!mode}>
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.black, marginBottom: 8 },
  subtitle: { color: colors.slate, marginBottom: 12 },
  item: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  active: { borderColor: colors.ghGreen, backgroundColor: '#ECF7F1' },
  itemText: { ...typography.bodyLg, color: colors.black },
  footer: { marginTop: 12 },
  price: { ...typography.bodyLg, marginBottom: 8 },
  eta: { color: colors.slate, marginBottom: 8 },
  cta: { backgroundColor: colors.ghGreen, padding: 14, borderRadius: 14, alignItems: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: colors.white, fontWeight: '700' },
  backText: { marginTop: 8, color: colors.slate, textAlign: 'center' },
});
