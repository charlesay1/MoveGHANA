import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export const PrimaryButton: React.FC<Props> = ({ label, onPress, disabled, loading }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={[styles.button, disabled && styles.disabled]}
  >
    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.text}>{label}</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.ghGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
