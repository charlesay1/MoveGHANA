import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { Screen } from '../components/Screen';

type Props = { name: string };

export const HomeScreen: React.FC<Props> = ({ name }) => (
  <Screen>
    <Text style={styles.title}>Welcome, {name || 'Driver'}</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Driver console</Text>
      <Text style={styles.cardText}>Go online • Accept trips • Earnings</Text>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 20 },
  card: { padding: 16, borderRadius: 20, backgroundColor: '#F7F9FB' },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  cardText: { color: colors.slate },
});
