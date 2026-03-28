import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button, Input } from '@/src/components/ui';
import { IntentSelector } from '@/src/components/shared/IntentMode';
import { useAuthStore } from '@/src/store/auth.store';
import { useSubStore } from '@/src/store/sub.store';
import { profileApi, storageApi } from '@/src/lib/api';
import { getInitial, getProfileGradient } from '@/src/utils/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import type { IntentMode } from '@/src/types';

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const { isMembersPlus } = useSubStore();
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [discreetMode, setDiscreetMode] = useState(profile?.is_incognito || false);
  const [safetyCheckin, setSafetyCheckin] = useState(false);

  const [fromColor, toColor] = getProfileGradient(profile?.id || '');
  const hasPhoto = profile?.photos && profile.photos.length > 0;

  const handleIntentChange = async (mode: IntentMode) => {
    if (!user) return;
    await profileApi.updateIntentMode(user.id, mode).catch(() => Alert.alert('Error', 'Could not update mode.'));
    await refreshProfile();
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.85 });
    if (!result.canceled && result.assets[0] && user) {
      try {
        const url = await storageApi.uploadPhoto(user.id, result.assets[0].uri, `${Date.now()}.jpg`);
        await profileApi.update(user.id, { photos: [url, ...(profile?.photos || [])] });
        await refreshProfile();
      } catch { Alert.alert('Error', 'Could not upload photo.'); }
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSaving(true);
    try { await profileApi.update(user.id, { bio }); await refreshProfile(); } catch { Alert.alert('Error', 'Could not save.'); } finally { setSaving(false); }
  };

  const handleDiscreetToggle = async (val: boolean) => {
    setDiscreetMode(val);
    if (user) await profileApi.update(user.id, { is_incognito: val });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="h3">My Profile</Text>
          <Text style={styles.sub}>Edit your member profile</Text>
        </View>

        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>Photos + Video</Text>
          <View style={styles.photoGrid}>
            <TouchableOpacity style={styles.photoMain} onPress={handlePickPhoto} activeOpacity={0.8}>
              {hasPhoto ? (
                <Image source={{ uri: profile!.photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <LinearGradient colors={[fromColor, toColor]} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={styles.photoInitial}>{getInitial(profile?.display_name)}</Text>
                </LinearGradient>
              )}
              <View style={styles.photoAddBadge}><Text style={styles.photoAddText}>+</Text></View>
            </TouchableOpacity>
            {[1,2,3,4].map((i) => (
              <TouchableOpacity key={i} style={styles.photoThumb} onPress={handlePickPhoto} activeOpacity={0.8}>
                {profile?.photos?.[i] ? <Image source={{ uri: profile.photos[i] }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={styles.photoPlus}>+</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.photoThumb, styles.videoSlot]} activeOpacity={0.8}>
              <Text style={{ fontSize: 22 }}>🎬</Text>
              <View style={styles.videoBadge}><Text style={styles.videoBadgeText}>15s</Text></View>
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>Members with video get 3× more taps.</Text>
        </View>

        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>About you</Text>
          <Input value={bio} onChangeText={setBio} placeholder="Write something real." multiline numberOfLines={4} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <Button label="Save" variant="primary" loading={saving} onPress={handleSaveBio} style={{ marginTop: Spacing.sm }} />
        </View>

        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>Your mode right now</Text>
          <IntentSelector selected={profile?.intent_mode || 'Chat'} onChange={handleIntentChange} />
        </View>

        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>Safety</Text>
          <View style={styles.safetyCard}>
            <View style={styles.safetyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.safetyTitle}>Check-in when meeting</Text>
                <Text style={styles.safetySub}>Share location with a trusted contact</Text>
              </View>
              <Switch value={safetyCheckin} onValueChange={setSafetyCheckin} trackColor={{ false: Colors.border, true: Colors.accent }} thumbColor={Colors.white} />
            </View>
            <View style={[styles.safetyRow, { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border2 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.safetyTitle}>Discreet mode</Text>
                <Text style={styles.safetySub}>Hide app icon on homescreen</Text>
              </View>
              <Switch value={discreetMode} onValueChange={handleDiscreetToggle} trackColor={{ false: Colors.border, true: Colors.accent }} thumbColor={Colors.white} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>Membership</Text>
          <View style={styles.membershipCard}>
            <Text style={styles.membershipTitle}>{isMembersPlus ? '✓ HUNT Black' : 'Free member'}</Text>
            {!isMembersPlus && (
              <Button label="Upgrade to HUNT Black" variant="primary" style={{ marginTop: Spacing.sm }} onPress={() => router.push('/paywall')} />
            )}
            {isMembersPlus && (
              <Button label="Restore purchases" variant="ghost" style={{ marginTop: Spacing.sm }} onPress={async () => {
                const { restorePurchases } = await import('@/src/lib/purchases');
                const ok = await restorePurchases();
                Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'HUNT Black is active.' : 'No active subscription found.');
              }} />
            )}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Button label="Sign out" variant="ghost" onPress={() => Alert.alert('Sign out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut }])} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  sub: { fontFamily: Typography.regular, fontSize: Typography.sm, color: Colors.accent, marginTop: 3 },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionTitle: { marginBottom: Spacing.md },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  photoMain: { width: '48%', aspectRatio: 0.75, backgroundColor: Colors.surface2, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  photoInitial: { fontFamily: Typography.brand, fontSize: 40, color: Colors.ice },
  photoAddBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: Colors.accent, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  photoAddText: { color: Colors.white, fontSize: 18, fontFamily: Typography.semibold },
  photoThumb: { width: '23%', aspectRatio: 0.75, backgroundColor: Colors.surface2, borderRadius: Radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  photoPlus: { fontSize: 22, color: Colors.ice3 },
  videoSlot: { borderColor: Colors.accentBorder },
  videoBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: Colors.accentBg, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2 },
  videoBadgeText: { fontFamily: Typography.medium, fontSize: 7, color: Colors.accent },
  photoHint: { fontFamily: Typography.regular, fontSize: 10, color: Colors.ice3, marginTop: Spacing.sm },
  safetyCard: { backgroundColor: Colors.surface2, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  safetyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  safetyTitle: { fontFamily: Typography.medium, fontSize: Typography.base, color: Colors.ice },
  safetySub: { fontFamily: Typography.regular, fontSize: 10, color: Colors.ice3, marginTop: 2 },
  membershipCard: { backgroundColor: Colors.surface2, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  membershipTitle: { fontFamily: Typography.brandMed, fontSize: Typography.md, color: Colors.ice },
});
