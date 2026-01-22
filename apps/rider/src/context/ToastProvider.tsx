import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export type ToastType = 'info' | 'error' | 'success';

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback((text: string, tone: ToastType = 'info') => {
    setMessage(text);
    setType(tone);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setMessage(null);
        });
      }, 2500);
    });
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <Animated.View style={[styles.toast, { opacity }, typeStyles[type]]}>
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.black,
  },
  text: { color: colors.white, fontSize: 14 },
});

const typeStyles = {
  info: { backgroundColor: '#1C2430' },
  error: { backgroundColor: colors.danger },
  success: { backgroundColor: colors.success },
};
