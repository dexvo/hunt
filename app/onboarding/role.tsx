import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth.store';
import { profileApi } from '@/src/lib/api';
import type { UserRole } from '@/src/types';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'top', label: '👑 Top', description: 'You take the lead.' },
  { value: 'bottom', label: '🎯 Bottom', description: 'You receive.' },
];

export default function OnboardingRole() {
  const { user, refreshProfile } = useAuthStore();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selected || !user) { setError('Please select a role to continue.'); return; }
    setSaving(true);
    try {
      await profileApi.update(user.id, {
        role: selected,
        has_completed_onboarding: true,
        onboarding_step: 3,
      });
      await refreshProfile();
      router.replace('/tabs');
    } catch { setError('Could not save. Try again.'); } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 3</Text>
          <Text variant="h2">Your role</Text>
          <Text variant="sm" style={{ marginTop: Spacing.sm }}>This defines your experience. Required.</Text>
        </View>

        <View style={styles.options}>
          {ROLES.map((role) => {
            const active = selected === role.value;
            return (
              <TouchableOpacity
                key={role.value}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => { setSelected(role.value); setError(''); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{role.label}</Text>
                <Text style={styles.optionDesc}>{role.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={saving ? 'Saving…' : 'Enter BREEDX'}
          variant="primary"
          fullWidth
          loading={saving}
          disabled={!selected || saving}
          onPress={handleContinue}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  header: { gap: 4 },
  step: { fontSize: Typography.xs, color: Colors.accent, letterSpacing: 2, textTransform: 'uppercase' },
  options: { gap: Spacing.md },
  option: {
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    gap: 4,
  },
  optionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentBg,
  },
  optionLabel: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.semibold as any,
    color: Colors.ice2,
  },
  optionLabelActive: {
    color: Colors.accent,
  },
  optionDesc: {
    fontSize: Typography.sm,
    color: Colors.ice3,
  },
  error: { fontSize: Typography.sm, color: Colors.error },
});
