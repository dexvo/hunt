import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { useSubStore } from '@/src/store/sub.store';

export default function ExploreScreen() {
  const { isMembersPlus } = useSubStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h3">Explore</Text>
      </View>
      <View style={styles.body}>
        {!isMembersPlus ? (
          <>
            <View style={styles.mark}>
              <View style={styles.markOuter}><View style={styles.markInner} /></View>
            </View>
            <Text style={styles.title}>LYNX Black feature</Text>
            <Text style={styles.sub}>Browse profiles by city, filter by vibe, and discover members outside your area.</Text>
            <Button label="Unlock with LYNX Black" variant="primary" onPress={() => router.push('/paywall')} style={{ marginTop: Spacing.xl }} />
          </>
        ) : (
          <Text style={styles.sub}>Coming soon.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  mark: { marginBottom: Spacing.xl },
  markOuter: { width: 44, height: 44, borderWidth: 1, borderColor: Colors.accent, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  markInner: { width: 24, height: 24, borderWidth: 0.5, borderColor: Colors.accentBorder },
  title: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.ice, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontSize: Typography.sm, color: Colors.ice3, textAlign: 'center', lineHeight: 20 },
});
