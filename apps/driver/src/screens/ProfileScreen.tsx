import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import type { Profile } from '../auth/types';

type Props = {
  profile: Profile;
  onSubmit: (profile: Profile) => void;
  onBack: () => void;
};

export const ProfileScreen: React.FC<Props> = ({ profile, onSubmit, onBack }) => {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [acceptedTerms, setAcceptedTerms] = useState(profile.acceptedTerms);

  const valid = useMemo(() => firstName.trim().length > 1 && acceptedTerms, [firstName, acceptedTerms]);

  return (
    <Screen>
      <Text style={styles.title}>Driver profile</Text>
      <Field label="First name" value={firstName} onChangeText={setFirstName} />
      <Field label="Last name (optional)" value={lastName} onChangeText={setLastName} />
      <Field
        label="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <View style={styles.terms}>
        <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} />
        <Text style={styles.termsText}>I agree to moveGH driver terms</Text>
      </View>
      <View style={styles.row}>
        <PrimaryButton label="Back" onPress={onBack} />
        <PrimaryButton
          label="Continue"
          onPress={() =>
            onSubmit({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim(),
              acceptedTerms,
            })
          }
          disabled={!valid}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  terms: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 24 },
  termsText: { marginLeft: 12, color: colors.slate },
  row: { gap: 12 },
});
