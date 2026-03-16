import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { getOfferings, purchasePackage, restorePurchases } from '@/src/lib/purchases';
import { useSubStore } from '@/src/store/sub.store';

const PERKS = [
  { icon: '◈', label: 'Unlimited messages' },
  { icon: '◎', label: 'See who tapped you' },
  { icon: '✓', label: 'LYNX Black verified badge' },
  { icon: '✈️', label: 'Travel mode — any city' },
  { icon: '🔒', label: 'Incognito browsing' },
  { icon: '🖼', label: 'Private albums with auto-expiry' },
  { icon: '⚡', label: 'Priority in nearby grid' },
  { icon: '○', label: 'No ads, ever' },
];

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { setMembersPlus } = useSubStore();

  useEffect(() => {
    getOfferings().then((pkgs) => {
      setPackages(pkgs);
      if (pkgs.length > 0) setSelected(pkgs[0]);
      setLoading(false);
    });
  }, []);

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const info = await purchasePackage(selected);
      const active = info.entitlements.active['members_plus'] !== undefined;
      setMembersPlus(active);
      if (active) {
        Alert.alert('Welcome to LYNX Black', 'You\'re in.');
        router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message || 'Something went wrong.');
    } finally { setPurchasing(false); }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const restored = await restorePurchases();
    setPurchasing(false);
    if (restored) {
      setMembersPlus(true);
      Alert.alert('Restored', 'LYNX Black is active.');
      router.back();
    } else {
      Alert.alert('Nothing to restore', 'No active subscription found.');
    }
  };

  const formatPrice = (pkg: PurchasesPackage) => pkg.product.priceString;
  const formatPeriod = (pkg: PurchasesPackage) => {
    const id = pkg.product.identifier.toLowerCase();
    if (id.includes('annual') || id.includes('year')) return '/year';
    if (id.includes('week')) return '/week';
    return '/month';
  };
  const getSavings = (pkg: PurchasesPackage) => {
    const id = pkg.product.identifier.toLowerCase();
    if (id.includes('annual') || id.includes('year')) return 'Save 40%';
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.mark}>
          <View style={styles.markOuter}><View style={styles.markInner} /></View>
        </View>

        <Text style={styles.title}>LYNX Black</Text>
        <Text style={styles.subtitle}>Not everyone gets in.</Text>

        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perk}>
              <Text style={styles.perkIcon}>{p.icon}</Text>
              <Text style={styles.perkLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
        ) : (
          <View style={styles.packages}>
            {packages.map((pkg) => {
              const isSelected = selected?.product.identifier === pkg.product.identifier;
              const savings = getSavings(pkg);
              return (
                <TouchableOpacity
                  key={pkg.product.identifier}
                  style={[styles.pkg, isSelected && styles.pkgSelected]}
                  onPress={() => setSelected(pkg)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pkgLeft}>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.pkgPeriod}>
                      {formatPeriod(pkg).replace('/', '').charAt(0).toUpperCase() + formatPeriod(pkg).slice(2)}
                    </Text>
                  </View>
                  <View style={styles.pkgRight}>
                    {savings && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{savings}</Text>
                      </View>
                    )}
                    <Text style={styles.pkgPrice}>
                      {formatPrice(pkg)}<Text style={styles.pkgPeriodText}>{formatPeriod(pkg)}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Button
          label={purchasing ? 'Processing…' : 'Join LYNX Black'}
          variant="primary"
          fullWidth
          loading={purchasing}
          disabled={!selected || purchasing}
          onPress={handlePurchase}
          style={styles.cta}
        />

        <Text style={styles.legal}>
          Subscription renews automatically. Cancel anytime in App Store or Google Play settings.
        </Text>

        <TouchableOpacity onPress={handleRestore} style={styles.restore}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.xl, alignItems: 'center', paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: Spacing.xl },
  closeText: { fontSize: 18, color: Colors.ice3 },
  mark: { marginBottom: Spacing.lg },
  markOuter: { width: 48, height: 48, borderWidth: 1, borderColor: Colors.accent, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  markInner: { width: 26, height: 26, borderWidth: 0.5, borderColor: Colors.accentBorder },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.semibold as any, color: Colors.ice, letterSpacing: Typography.tight as any, textAlign: 'center' },
  subtitle: { fontSize: 13, color: Colors.accent, letterSpacing: 2, textTransform: 'uppercase', marginTop: 6, marginBottom: Spacing.xl },
  perks: { width: '100%', gap: 12, marginBottom: Spacing.xl },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  perkLabel: { fontSize: 14, color: Colors.ice2, fontWeight: Typography.regular as any },
  packages: { width: '100%', gap: 10, marginBottom: Spacing.xl },
  pkg: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg },
  pkgSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentBg },
  pkgLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  pkgPeriod: { fontSize: 15, fontWeight: Typography.semibold as any, color: Colors.ice },
  pkgRight: { alignItems: 'flex-end', gap: 4 },
  savingsBadge: { backgroundColor: Colors.accentBg, borderWidth: 1, borderColor: Colors.accentBorder, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  savingsText: { fontSize: 10, color: Colors.accent, fontWeight: Typography.semibold as any },
  pkgPrice: { fontSize: 16, fontWeight: Typography.semibold as any, color: Colors.ice },
  pkgPeriodText: { fontSize: 12, fontWeight: Typography.regular as any, color: Colors.ice3 },
  cta: { marginBottom: Spacing.md },
  legal: { fontSize: 10, color: Colors.ice3, textAlign: 'center', lineHeight: 16, marginBottom: Spacing.md },
  restore: { padding: 8 },
  restoreText: { fontSize: 12, color: Colors.accent },
});
