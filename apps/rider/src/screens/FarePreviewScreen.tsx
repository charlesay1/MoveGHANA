import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useBooking } from '../context/BookingProvider';
import { Screen } from '../components/Screen';
import { useSession } from '../session/SessionProvider';
import { confirmPaymentIntent, createIdempotencyKey, createPaymentIntent } from '../services/paymentService';

export const FarePreviewScreen: React.FC<{ onRequest: () => void; onBack: () => void }> = ({
  onRequest,
  onBack,
}) => {
  const { pickup, destination, mode, fare, distanceKm } = useBooking();
  const { state } = useSession();
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'wallet'>('momo');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRequest = Boolean(pickup && destination && mode && fare);

  const handleRequest = async () => {
    if (!canRequest || processing) return;
    if (!state.user?.id || !state.phone || !fare) {
      setError('Complete your profile before paying.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const intent = await createPaymentIntent(
        {
          tripId: `${pickup?.label ?? 'trip'}_${Date.now()}`,
          riderId: state.user.id,
          amount: fare.total,
          currency: fare.currency,
          provider: 'mock',
          phoneNumber: state.phone,
        },
        createIdempotencyKey()
      );
      await confirmPaymentIntent(
        intent.intentId,
        { phoneNumber: state.phone, driverId: 'driver_mock' },
        createIdempotencyKey()
      );
      onRequest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setProcessing(false);
    }
  };

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
        <Text style={styles.value}>GHS {fare?.total?.toFixed(2)}</Text>
        {fare && (
          <Text style={styles.breakdown}>
            Base {fare.breakdown.baseFare.toFixed(2)} · Distance {fare.breakdown.distanceFare.toFixed(2)} · Region x{fare.breakdown.regionMultiplier} · Vehicle x{fare.breakdown.vehicleMultiplier}
          </Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Payment method</Text>
        <View style={styles.paymentRow}>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'momo' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('momo')}
          >
            <Text style={styles.paymentText}>Mobile Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('wallet')}
          >
            <Text style={styles.paymentText}>MoveGH Wallet</Text>
          </TouchableOpacity>
        </View>
        {processing && (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.processingText}>Processing payment...</Text>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      <TouchableOpacity
        style={[styles.cta, (!canRequest || processing) && styles.ctaDisabled]}
        onPress={handleRequest}
        disabled={!canRequest || processing}
      >
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
  breakdown: { marginTop: 8, color: colors.slate, fontSize: 12 },
  cta: { backgroundColor: colors.ghGreen, padding: 14, borderRadius: 14, alignItems: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: colors.white, fontWeight: '700' },
  backText: { marginTop: 12, color: colors.slate, textAlign: 'center' },
  paymentRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  paymentOption: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.slate },
  paymentOptionActive: { borderColor: colors.ghGreen, backgroundColor: colors.mint },
  paymentText: { textAlign: 'center', color: colors.black, fontWeight: '600' },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  processingText: { color: colors.slate },
  errorText: { color: colors.danger, marginTop: 8 },
});
