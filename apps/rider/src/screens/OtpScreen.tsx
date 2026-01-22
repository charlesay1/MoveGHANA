import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@movegh/theme';
import { isValidOtp } from '@movegh/utils';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';

type Props = {
  phone: string;
  otp: string;
  requestId?: string;
  onSubmit: (requestId: string, code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
};

export const OtpScreen: React.FC<Props> = ({
  phone,
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

  useEffect(() => {
    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async () => {
    if (!requestId) {
      setError('Request expired. Please resend the code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(requestId, value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setResendLoading(true);
    try {
      await onResend();
      setTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.caption}>We sent a code to {phone}</Text>
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
      <View style={styles.row}>
        <PrimaryButton label="Back" onPress={onBack} />
        <PrimaryButton label="Verify" onPress={handleSubmit} disabled={!valid} loading={loading} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
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
  error: { marginTop: 12, color: colors.ghRed },
  timer: { marginTop: 12, color: colors.slate },
  row: { marginTop: 28, gap: 12 },
});
