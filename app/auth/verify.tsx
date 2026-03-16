import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography } from '@/src/constants/tokens';
import { Text, Input, Button } from '@/src/components/ui';
import { supabase } from '@/src/lib/supabase';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (otp.length < 4) { setError('Enter the code we sent you.'); return; }
    setLoading(true); setError('');
    const { data, error: e } = await supabase.auth.verifyOtp({ phone: phone || '', token: otp, type: 'sms' });
    setLoading(false);
    if (e) { setError(e.message); return; }
    if (data.user) {
      // Check if profile exists
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
      router.replace(profile ? '/tabs' : '/onboarding/photos');
    }
  };

  const handleResend = async () => {
    await supabase.auth.signInWithOtp({ phone: phone || '' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <View style={styles.inner}>
        <Text variant="h2">Check your phone</Text>
        <Text variant="sm" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}>Enter the code sent to {phone}</Text>
        <Input value={otp} onChangeText={(t) => { setOtp(t.replace(/\D/g, '')); setError(''); }} placeholder="6-digit code" keyboardType="numeric" returnKeyType="done" onSubmitEditing={handleVerify} autoFocus maxLength={6} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Verify" variant="primary" fullWidth loading={loading} onPress={handleVerify} style={{ marginTop: Spacing.xl }} />
        <TouchableOpacity onPress={handleResend} style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
          <Text style={styles.resend}>Resend code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  back: { padding: Spacing.lg },
  backText: { fontSize: 20, color: Colors.ice3 },
  inner: { flex: 1, padding: Spacing.xl, paddingTop: Spacing.lg },
  error: { fontSize: Typography.sm, color: Colors.error, marginTop: Spacing.sm },
  resend: { fontSize: Typography.sm, color: Colors.accent },
});
