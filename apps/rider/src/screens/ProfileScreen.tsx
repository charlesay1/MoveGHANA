import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '@movegh/theme';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import type { Profile } from '../auth/types';

type Props = {
  profile: Profile;
  onSubmit: (profile: Profile) => Promise<void>;
  onBack: () => void;
};

export const ProfileScreen: React.FC<Props> = ({ profile, onSubmit, onBack }) => {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [acceptedTerms, setAcceptedTerms] = useState(profile.acceptedTerms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = useMemo(() => firstName.trim().length > 1 && acceptedTerms, [firstName, acceptedTerms]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        acceptedTerms,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Your profile</Text>
      <Field label="First name" value={firstName} onChangeText={setFirstName} />
      <Field label="Last name (optional)" value={lastName} onChangeText={setLastName} />
      <Field
        label="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <View style={styles.terms}>
        <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} />
        <Text style={styles.termsText}>I agree to moveGH terms & privacy</Text>
      </View>
      <View style={styles.row}>
        <PrimaryButton label="Back" onPress={onBack} />
        <PrimaryButton
          label="Continue"
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
  error: { color: colors.ghRed, marginBottom: 12 },
  terms: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 24 },
  termsText: { marginLeft: 12, color: colors.slate },
  row: { gap: 12 },
});
