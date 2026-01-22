import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useBooking } from '../context/BookingProvider';
import { Screen } from '../components/Screen';

export const FarePreviewScreen: React.FC<{ onRequest: () => void; onBack: () => void }> = ({
  onRequest,
  onBack,
}) => {
  const { pickup, destination, mode, fare, distanceKm } = useBooking();
  const canRequest = Boolean(pickup && destination && mode && fare);

  return (
    <Screen>
      <Text style={styles.title}>Fare preview</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{pickup?.label}</Text>
        <Text style={styles.label}>Destination</Text>
        <Text style={styles.value}>{destination?.label}</Text>
        <Text style={styles.label}>Vehicle</Text>
        <Text style={styles.value}>{mode}</Text>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{distanceKm.toFixed(1)} km</Text>
        <Text style={styles.label}>Price</Text>
        <Text style={styles.value}>GHS {fare?.price?.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={[styles.cta, !canRequest && styles.ctaDisabled]} onPress={onRequest} disabled={!canRequest}>
        <Text style={styles.ctaText}>Request Ride</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.black, marginBottom: 12 },
  card: { backgroundColor: colors.mist, padding: 16, borderRadius: 16, marginBottom: 16 },
  label: { color: colors.slate, marginTop: 8 },
  value: { ...typography.bodyLg, color: colors.black },
  cta: { backgroundColor: colors.ghGreen, padding: 14, borderRadius: 14, alignItems: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: colors.white, fontWeight: '700' },
  backText: { marginTop: 12, color: colors.slate, textAlign: 'center' },
});
