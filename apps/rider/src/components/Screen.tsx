import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { colors } from '@movegh/theme';

export const Screen: React.FC<React.PropsWithChildren> = ({ children }) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, padding: 20, backgroundColor: colors.white },
});
