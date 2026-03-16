import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Input, Button } from '@/src/components/ui';
import { supabase } from '@/src/lib/supabase';

const COUNTRY_CODES = [
  { code: '+503', flag: '🇸🇻', name: 'SV' },
  { code: '+52',  flag: '🇲🇽', name: 'MX' },
  { code: '+1',   flag: '🇺🇸', name: 'US' },
  { code: '+57',  flag: '🇨🇴', name: 'CO' },
  { code: '+502', flag: '🇬🇹', name: 'GT' },
];

export default function PhoneScreen() {
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCountries, setShowCountries] = useState(false);

  const handleSubmit = async () => {
    if (phone.length < 7) { setError('Enter a valid phone number.'); return; }
    setLoading(true); setError('');
    const fullPhone = `${countryCode.code}${phone.replace(/\D/g, '')}`;
    const { error: e } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (e) { setError(e.message); return; }
    router.push({ pathname: '/auth/verify', params: { phone: fullPhone } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <View style={styles.inner}>
        <Text variant="h2">Your number</Text>
        <Text variant="sm" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}>We'll send a code to verify.</Text>

        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.countryPicker} onPress={() => setShowCountries(!showCountries)} activeOpacity={0.8}>
            <Text style={styles.flag}>{countryCode.flag}</Text>
            <Text style={styles.code}>{countryCode.code}</Text>
          </TouchableOpacity>
          <Input value={phone} onChangeText={(t) => { setPhone(t); setError(''); }} placeholder="Phone number" keyboardType="phone-pad" returnKeyType="done" onSubmitEditing={handleSubmit} autoFocus style={{ flex: 1 }} />
        </View>

        {showCountries && (
          <View style={styles.dropdown}>
            {COUNTRY_CODES.map((c) => (
              <TouchableOpacity key={c.code} style={styles.dropdownRow} onPress={() => { setCountryCode(c); setShowCountries(false); }} activeOpacity={0.7}>
                <Text style={styles.flag}>{c.flag}</Text>
                <Text style={styles.dropdownName}>{c.name}</Text>
                <Text style={styles.dropdownCode}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Send code" variant="primary" fullWidth loading={loading} onPress={handleSubmit} style={{ marginTop: Spacing.xl }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  back: { padding: Spacing.lg },
  backText: { fontSize: 20, color: Colors.ice3 },
  inner: { flex: 1, padding: Spacing.xl, paddingTop: Spacing.lg },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  countryPicker: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 48 },
  flag: { fontSize: 20 },
  code: { fontSize: Typography.base, color: Colors.ice2 },
  dropdown: { marginTop: Spacing.sm, backgroundColor: Colors.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropdownName: { flex: 1, fontSize: Typography.base, color: Colors.ice2 },
  dropdownCode: { fontSize: Typography.sm, color: Colors.ice3 },
  error: { fontSize: Typography.sm, color: Colors.error, marginTop: Spacing.sm },
});
