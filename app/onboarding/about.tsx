import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/src/constants/tokens';
import { Text, Input, Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth.store';
import { profileApi } from '@/src/lib/api';

export default function OnboardingAbout() {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!name.trim() || !age || !user) { setError('Name and age are required.'); return; }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) { setError('You must be 18 or older.'); return; }
    setSaving(true);
    try {
      await profileApi.update(user.id, {
        display_name: name.trim(),
        age: ageNum,
        intent_mode: 'Chat',
        is_incognito: false,
        onboarding_step: 3,
      });
      router.push('/onboarding/role');
    } catch { setError('Could not save. Try again.'); } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text variant="h2">About you</Text>
        <Text variant="sm" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}>Real information only.</Text>
        <View style={styles.fields}>
          <Input value={name} onChangeText={setName} placeholder="Display name" autoFocus />
          <Input value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric" maxLength={2} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={saving ? 'Saving…' : 'Continue'}
          variant="primary"
          fullWidth
          loading={saving}
          disabled={!name || !age}
          onPress={handleContinue}
          style={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.xl },
  step: { fontSize: Typography.xs, color: Colors.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  fields: { gap: Spacing.md, marginBottom: Spacing.sm },
  error: { fontSize: Typography.sm, color: Colors.error, marginTop: Spacing.sm },
});
