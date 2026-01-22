import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { isValidGhanaPhone, normalizeGhanaPhone } from '@movegh/utils';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';

type Props = {
  phone: string;
  onSubmit: (phone: string) => Promise<void>;
  onBack: () => void;
};

export const PhoneScreen: React.FC<Props> = ({ phone, onSubmit, onBack }) => {
  const [value, setValue] = useState(phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const valid = useMemo(() => isValidGhanaPhone(value), [value]);
  const showInvalid = value.length > 0 && !valid;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await onSubmit(normalizeGhanaPhone(value));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to send verification code. Try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Enter your phone</Text>
      <Text style={styles.caption}>Ghana only (+233). We will send a 6-digit OTP.</Text>
      <Field
        label="Phone number"
        value={value}
        onChangeText={setValue}
        keyboardType="phone-pad"
        placeholder="024 123 4567"
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
        <PrimaryButton
          label="Send OTP"
          onPress={handleSubmit}
          disabled={!valid}
          loading={loading}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  caption: { color: colors.slate, marginBottom: 20 },
  error: { color: colors.ghRed, marginBottom: 8 },
  note: { color: colors.slate, marginBottom: 24 },
  row: { gap: 12 },
});
