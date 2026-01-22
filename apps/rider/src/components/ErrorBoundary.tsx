import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';

type State = { hasError: boolean };

type Props = { children: React.ReactNode };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('moveGH error boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.text}>Please restart the app or try again in a moment.</Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#F7F9FB', padding: 24, borderRadius: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  text: { color: colors.slate },
});
