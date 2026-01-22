import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';

type Props = { message: string; tone?: 'info' | 'error' };

export const StatusBanner: React.FC<Props> = ({ message, tone = 'info' }) => (
  <View style={[styles.banner, tone === 'error' && styles.error]}>
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F3EC',
  },
  error: {
    backgroundColor: '#FDECEC',
  },
  text: {
    color: colors.charcoal,
    fontSize: 12,
  },
});
