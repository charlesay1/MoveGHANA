import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';

type Props = { onNext: () => void };

export const WelcomeScreen: React.FC<Props> = ({ onNext }) => (
  <Screen>
    <View style={styles.hero}>
      <Text style={styles.title}>moveGH</Text>
      <Text style={styles.tagline}>Ghana in Motion</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.subtitle}>Smarter rides and deliveries nationwide.</Text>
      <PrimaryButton label="Continue with phone number" onPress={onNext} />
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  hero: { marginTop: 24, marginBottom: 40 },
  title: { ...typography.h1, fontSize: 36, color: colors.black },
  tagline: { marginTop: 12, fontSize: 16, color: colors.slate },
  card: {
    marginTop: 'auto',
    backgroundColor: '#F7F9FB',
    padding: 20,
    borderRadius: 20,
  },
  subtitle: { fontSize: 16, marginBottom: 16, color: colors.charcoal },
});
