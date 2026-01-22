import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { isValidGhanaPhone, normalizeGhanaPhone } from '@movegh/utils';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';

type Props = {
  phone: string;
  onSubmit: (phone: string) => void;
  onBack: () => void;
};

export const PhoneScreen: React.FC<Props> = ({ phone, onSubmit, onBack }) => {
  const [value, setValue] = useState(phone);
  const valid = useMemo(() => isValidGhanaPhone(value), [value]);

  return (
    <Screen>
      <Text style={styles.title}>Driver phone</Text>
      <Text style={styles.caption}>Use your Ghana number (+233).</Text>
      <Field
        label="Phone number"
        value={value}
        onChangeText={setValue}
        keyboardType="phone-pad"
        placeholder="024 123 4567"
        maxLength={14}
      />
      <View style={styles.row}>
        <PrimaryButton label="Back" onPress={onBack} />
        <PrimaryButton
          label="Send OTP"
          onPress={() => onSubmit(normalizeGhanaPhone(value))}
          disabled={!valid}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  caption: { color: colors.slate, marginBottom: 20 },
  row: { gap: 12 },
});
