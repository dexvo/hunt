import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { IntentSelector } from '@/src/components/shared/IntentMode';
import { useAuthStore } from '@/src/store/auth.store';
import { profileApi } from '@/src/lib/api';
import type { IntentMode } from '@/src/types';

export default function OnboardingIntent() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<IntentMode>('Chat');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    await profileApi.updateIntentMode(user.id, mode).catch(() => {});
    router.replace('/tabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.step}>4 of 4</Text>
        <Text variant="h2">What are you here for?</Text>
        <Text variant="sm" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}>Shown on your profile card. Change any time.</Text>
        <IntentSelector selected={mode} onChange={setMode} />
        <Button label={saving ? 'Setting up…' : "I'm in"} variant="primary" fullWidth loading={saving} onPress={handleFinish} style={{ marginTop: Spacing.xl }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, padding: Spacing.xl },
  step: { fontSize: Typography.xs, color: Colors.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
});
