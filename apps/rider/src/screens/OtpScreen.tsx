import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { isValidOtp } from '@movegh/utils';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useToast } from '../context/ToastProvider';

type Props = {
  phone: string;
  maskedPhone?: string;
  otp: string;
  requestId?: string;
  onSubmit: (requestId: string, code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
};

export const OtpScreen: React.FC<Props> = ({
  phone,
  maskedPhone,
  otp,
  requestId,
  onSubmit,
  onResend,
  onBack,
}) => {
  const [value, setValue] = useState(otp);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const valid = useMemo(() => isValidOtp(value, 6), [value]);
  const toast = useToast();
  const lastSubmit = useRef<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!requestId) {
      setError('Code expired. Resend a new code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(requestId, value);
    } catch (err) {
      const message = mapOtpError(err);
      setError(message);
      toast.show(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [onSubmit, requestId, toast, value]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!valid || loading) return;
    if (lastSubmit.current === value) return;
    lastSubmit.current = value;
    void handleSubmit();
  }, [valid, value, loading, handleSubmit]);

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setResendLoading(true);
    try {
      await onResend();
      setTimer(30);
      setValue('');
      lastSubmit.current = null;
    } catch (err) {
      const message = mapOtpError(err);
      setError(message);
      toast.show(message, 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Verify your phone</Text>
      <Text style={styles.caption}>
        We sent a 6-digit code to {maskedPhone || phone}.
      </Text>
      <TextInput
        style={styles.otp}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
        maxLength={6}
        autoFocus
      />
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <Pressable onPress={handleResend} disabled={timer > 0 || resendLoading}>
        <Text style={styles.timer}>
          {timer > 0 ? `Resend in ${timer}s` : resendLoading ? 'Resending...' : 'Resend code'}
        </Text>
      </Pressable>
      <Text style={styles.helper}>Didn’t get it? Check SMS spam or try again in 30 seconds.</Text>
      <View style={styles.row}>
        <PrimaryButton label="Back" onPress={onBack} />
        <PrimaryButton label="Verify" onPress={handleSubmit} disabled={!valid} loading={loading} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.black, marginBottom: 8 },
  caption: { color: colors.slate, marginBottom: 24 },
  otp: {
    borderWidth: 1,
    borderColor: '#D9DCE2',
    borderRadius: 16,
    padding: 16,
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
    backgroundColor: '#FAFBFC',
  },
  error: { marginTop: 12, color: colors.danger },
  timer: { marginTop: 12, color: colors.slate },
  helper: { marginTop: 8, color: colors.slate },
  row: { marginTop: 28, gap: 12 },
});

const mapOtpError = (err: unknown) => {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('expired')) {
      return 'Code expired. Resend a new code.';
    }
    if (msg.includes('too many')) {
      return 'Too many attempts. Please wait 1 minute and try again.';
    }
    if (msg.includes('network') || msg.includes('timeout')) {
      return 'Network error. Check your connection and retry.';
    }
    if (msg.includes('invalid')) {
      return 'Invalid code. Try again.';
    }
    return err.message;
  }
  return 'Network error. Check your connection and retry.';
};
