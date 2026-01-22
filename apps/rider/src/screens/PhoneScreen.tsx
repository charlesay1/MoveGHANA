import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { isValidGhanaPhone, normalizeGhanaPhone } from '@movegh/utils';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useToast } from '../context/ToastProvider';

type Props = {
  phone: string;
  onSubmit: (phone: string) => Promise<void>;
  onBack: () => void;
};

export const PhoneScreen: React.FC<Props> = ({ phone, onSubmit, onBack }) => {
  const [value, setValue] = useState(phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOther, setShowOther] = useState(false);
  const valid = useMemo(() => isValidGhanaPhone(value), [value]);
  const showInvalid = value.length > 0 && !valid;
  const toast = useToast();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await onSubmit(normalizeGhanaPhone(value));
    } catch (err) {
      const message = mapNetworkError(err);
      setError(message);
      toast.show(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Welcome to moveGH</Text>
      <Text style={styles.caption}>Sign in or create an account.</Text>
      <Field
        label="Phone number"
        value={value}
        onChangeText={setValue}
        keyboardType="phone-pad"
        placeholder="+233 24 123 4567"
        maxLength={14}
      />
      {showInvalid && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          Enter a valid Ghana phone number.
        </Text>
      )}
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <Text style={styles.note}>We accept MTN, Vodafone, AirtelTigo numbers.</Text>
      <View style={styles.row}>
        <PrimaryButton label="Back" onPress={onBack} />
        <PrimaryButton label="Continue" onPress={handleSubmit} disabled={!valid} loading={loading} />
      </View>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.line} />
      </View>
      <TouchableOpacity onPress={() => setShowOther((prev) => !prev)} style={styles.otherToggle}>
        <Text style={styles.otherText}>{showOther ? 'Hide other options' : 'Other options'}</Text>
      </TouchableOpacity>
      {showOther && (
        <View style={styles.otherButtons}>
          <PrimaryButton label="Continue with Google" onPress={() => toast.show('Google login coming soon.', 'info')} />
          <PrimaryButton label="Continue with Apple" onPress={() => toast.show('Apple login coming soon.', 'info')} />
        </View>
      )}
      <Text style={styles.footer}>
        By continuing, you agree to our Terms and Privacy Policy.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.black, marginBottom: 8 },
  caption: { color: colors.slate, marginBottom: 20 },
  error: { color: colors.ghRed, marginBottom: 8 },
  note: { color: colors.slate, marginBottom: 24 },
  row: { gap: 12, marginBottom: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerText: { marginHorizontal: 12, color: colors.slate },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  otherToggle: { alignItems: 'center' },
  otherText: { color: colors.slate },
  otherButtons: { marginTop: 12, gap: 12 },
  footer: { marginTop: 24, fontSize: 12, color: colors.slate, textAlign: 'center' },
});

const mapNetworkError = (err: unknown) => {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('timeout')) {
      return 'Network error. Check your connection and retry.';
    }
    return err.message;
  }
  return 'Network error. Check your connection and retry.';
};
