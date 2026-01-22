import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import type { Profile } from '../auth/types';
import { useToast } from '../context/ToastProvider';

type Props = {
  profile: Profile;
  onSubmit: (profile: Profile) => Promise<void>;
  onBack: () => void;
};

export const ProfileScreen: React.FC<Props> = ({ profile, onSubmit, onBack }) => {
  const initialFullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(profile.email || '');
  const [acceptedTerms, setAcceptedTerms] = useState(profile.acceptedTerms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const valid = useMemo(() => fullName.trim().length > 1 && acceptedTerms, [fullName, acceptedTerms]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts.shift() ?? '';
      const lastName = parts.length ? parts.join(' ') : undefined;
      await onSubmit({
        firstName,
        lastName,
        email: email.trim(),
        acceptedTerms,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update profile.';
      setError(message);
      toast.show(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Set up your account</Text>
      <Text style={styles.subtitle}>This helps drivers find you.</Text>
      <Field label="Full name" value={fullName} onChangeText={setFullName} />
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
  title: { ...typography.h2, color: colors.black, marginBottom: 8 },
  subtitle: { color: colors.slate, marginBottom: 16 },
  error: { color: colors.danger, marginBottom: 12 },
  terms: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 24 },
  termsText: { marginLeft: 12, color: colors.slate },
  row: { gap: 12 },
});
