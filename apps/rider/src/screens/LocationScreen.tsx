import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useLocation } from '../context/LocationProvider';
import { useToast } from '../context/ToastProvider';

type Props = {
  onAllow: () => void;
  onSkip: () => void;
};

export const LocationScreen: React.FC<Props> = ({ onAllow, onSkip }) => (
  <LocationContent onAllow={onAllow} onSkip={onSkip} />
);

const LocationContent: React.FC<Props> = ({ onAllow, onSkip }) => {
  const { requestPermission, loading } = useLocation();
  const toast = useToast();

  const handleAllow = async () => {
    const granted = await requestPermission();
    if (granted) {
      onAllow();
    } else {
      toast.show('Location permission denied.', 'error');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Enable location</Text>
      <Text style={styles.caption}>We use your location to show pickup points and routes.</Text>
      <View style={styles.card}>
        <Text style={styles.tip}>Ghana-friendly pickup points: markets, junctions, churches.</Text>
      </View>
      <View style={styles.row}>
        <PrimaryButton label="Not now" onPress={onSkip} />
        <PrimaryButton label="Allow location" onPress={handleAllow} loading={loading} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.black, marginBottom: 8 },
  caption: { color: colors.slate, marginBottom: 20 },
  card: { padding: 16, borderRadius: 16, backgroundColor: '#F7F9FB', marginBottom: 24 },
  tip: { color: colors.black },
  row: { gap: 12 },
});
