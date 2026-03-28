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
            <View style={styles.crosshair}>
              <View style={styles.ring}><View style={styles.dot} /></View>
              <View style={[styles.line, styles.lineTop]} />
              <View style={[styles.line, styles.lineBottom]} />
              <View style={[styles.lineH, styles.lineLeft]} />
              <View style={[styles.lineH, styles.lineRight]} />
            </View>
            <Text style={styles.title}>HUNT Black feature</Text>
            <Text style={styles.sub}>Browse profiles by city, filter by vibe, and discover members outside your area.</Text>
            <Button label="Unlock with HUNT Black" variant="primary" onPress={() => router.push('/paywall')} style={{ marginTop: Spacing.xl }} />
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
  crosshair: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  ring: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  line: { position: 'absolute', width: 1.5, height: 9, backgroundColor: Colors.accent },
  lineTop: { top: 0 },
  lineBottom: { bottom: 0 },
  lineH: { position: 'absolute', width: 9, height: 1.5, backgroundColor: Colors.accent },
  lineLeft: { left: 0, top: '50%', marginTop: -0.75 },
  lineRight: { right: 0, top: '50%', marginTop: -0.75 },
  title: { fontFamily: Typography.brandMed, fontSize: Typography.lg, color: Colors.ice, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontFamily: Typography.regular, fontSize: Typography.sm, color: Colors.ice3, textAlign: 'center', lineHeight: 20 },
});
