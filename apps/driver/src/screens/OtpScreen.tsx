import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@movegh/theme';
import { isValidOtp } from '@movegh/utils';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';

type Props = {
  phone: string;
  otp: string;
  onSubmit: (otp: string) => void;
  onBack: () => void;
};

export const OtpScreen: React.FC<Props> = ({ phone, otp, onSubmit, onBack }) => {
  const [value, setValue] = useState(otp);
  const [timer, setTimer] = useState(30);
  const valid = useMemo(() => isValidOtp(value, 6), [value]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Screen>
      <Text style={styles.title}>OTP for {phone}</Text>
      <TextInput
        style={styles.otp}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
        maxLength={6}
        autoFocus
      />
      <Text style={styles.timer}>{timer > 0 ? `Resend in ${timer}s` : 'Resend code'}</Text>
      <View style={styles.row}>
        <PrimaryButton label="Back" onPress={onBack} />
        <PrimaryButton label="Verify" onPress={() => onSubmit(value)} disabled={!valid} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
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
  timer: { marginTop: 12, color: colors.slate },
  row: { marginTop: 28, gap: 12 },
});
