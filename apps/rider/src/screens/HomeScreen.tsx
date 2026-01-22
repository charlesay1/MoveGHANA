import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { Screen } from '../components/Screen';

type Props = { name: string };

export const HomeScreen: React.FC<Props> = ({ name }) => (
  <Screen>
    <Text style={styles.title}>Hi {name || 'there'} 👋</Text>
    <View style={styles.map}>
      <Text style={styles.mapLabel}>Map placeholder</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Quick actions</Text>
      <Text style={styles.cardText}>Request a ride • Schedule pickup • Send delivery</Text>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 20 },
  map: {
    height: 260,
    borderRadius: 24,
    backgroundColor: '#E7EBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabel: { color: colors.slate },
  card: { marginTop: 20, padding: 16, borderRadius: 20, backgroundColor: '#F7F9FB' },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  cardText: { color: colors.slate },
});
