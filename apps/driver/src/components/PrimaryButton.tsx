import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@movegh/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export const PrimaryButton: React.FC<Props> = ({ label, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={[styles.button, disabled && styles.disabled]}
  >
    <Text style={styles.text}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.ghRed,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  text: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
