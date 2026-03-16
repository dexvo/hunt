import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <View style={styles.markOuter}><View style={styles.markInner} /></View>
        </View>
        <Text style={styles.logo}>LYNX</Text>
        <Text style={styles.tagline}>Not everyone gets in.</Text>
      </View>
      <View style={styles.bottom}>
        <Button label="Continue with phone" variant="primary" fullWidth onPress={() => router.push('/auth/phone')} />
        <Text style={styles.legal}>By continuing you agree to our Terms and Privacy Policy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.xl, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  mark: { marginBottom: Spacing.sm },
  markOuter: { width: 56, height: 56, borderWidth: 1, borderColor: Colors.accent, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  markInner: { width: 30, height: 30, borderWidth: 0.5, borderColor: Colors.accentBorder },
  logo: { fontSize: Typography['4xl'], fontWeight: Typography.semibold as any, letterSpacing: 8, color: Colors.ice },
  tagline: { fontSize: Typography.sm, color: Colors.accent, letterSpacing: 3, textTransform: 'uppercase' },
  bottom: { gap: Spacing.md, paddingBottom: Spacing.xl },
  legal: { fontSize: Typography.xs, color: Colors.ice3, textAlign: 'center', lineHeight: 16 },
});
