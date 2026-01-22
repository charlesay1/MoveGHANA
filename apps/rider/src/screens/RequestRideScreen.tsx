import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useBooking } from '../context/BookingProvider';
import { Screen } from '../components/Screen';
import { PrimaryButton } from '../components/PrimaryButton';

export const RequestRideScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { status, searching, request, ride, reset, error } = useBooking();

  useEffect(() => {
    if (!ride && !searching) {
      request();
    }
  }, [request, ride, searching]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Finding a driver</Text>
        {searching && <ActivityIndicator />}
        {error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.subtitle}>Status: {status?.status ?? 'searching'}</Text>
        {status?.status === 'matched' && (
          <PrimaryButton
            label="Back to Home"
            onPress={() => {
              reset();
              onDone();
            }}
          />
        )}
        {error && (
          <View style={styles.actions}>
            <PrimaryButton label="Try again" onPress={request} />
            <PrimaryButton
              label="Back"
              onPress={() => {
                reset();
                onDone();
              }}
            />
          </View>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.black, textAlign: 'center', marginBottom: 8 },
  subtitle: { color: colors.slate, textAlign: 'center', marginBottom: 16 },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 8 },
  actions: { marginTop: 16, gap: 12 },
});
