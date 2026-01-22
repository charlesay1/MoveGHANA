import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';

type Props = {
  onAllow: () => void;
  onSkip: () => void;
};

export const LocationScreen: React.FC<Props> = ({ onAllow, onSkip }) => (
  <Screen>
    <Text style={styles.title}>Enable location</Text>
    <Text style={styles.caption}>We use your location for accurate pickup points and routes.</Text>
    <View style={styles.card}>
      <Text style={styles.tip}>Ghana-friendly pickup points: markets, junctions, churches.</Text>
    </View>
    <View style={styles.row}>
      <PrimaryButton label="Not now" onPress={onSkip} />
      <PrimaryButton label="Allow location" onPress={onAllow} />
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  caption: { color: colors.slate, marginBottom: 20 },
  card: { padding: 16, borderRadius: 16, backgroundColor: '#F7F9FB', marginBottom: 24 },
  tip: { color: colors.charcoal },
  row: { gap: 12 },
});
