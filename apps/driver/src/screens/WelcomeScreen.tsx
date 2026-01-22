import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';

type Props = { onNext: () => void };

export const WelcomeScreen: React.FC<Props> = ({ onNext }) => (
  <Screen>
    <View style={styles.hero}>
      <Text style={styles.title}>moveGH Driver</Text>
      <Text style={styles.tagline}>Drive smarter. Earn nationwide.</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.subtitle}>Verified drivers, safer trips, better rewards.</Text>
      <PrimaryButton label="Start driving" onPress={onNext} />
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  hero: { marginTop: 24, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: colors.charcoal },
  tagline: { marginTop: 12, fontSize: 16, color: colors.slate },
  card: {
    marginTop: 'auto',
    backgroundColor: '#F7F9FB',
    padding: 20,
    borderRadius: 20,
  },
  subtitle: { fontSize: 16, marginBottom: 16, color: colors.charcoal },
});
