import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { IntentPill } from '@/src/components/shared/IntentMode';
import { useAuthStore } from '@/src/store/auth.store';
import { profileApi, chatApi, tapsApi } from '@/src/lib/api';
import { getInitial, getProfileGradient } from '@/src/utils/helpers';
import type { Profile } from '@/src/types';

const { width } = Dimensions.get('window');

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tapping, setTapping] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    profileApi.getById(id).then(setProfile).catch(() => Alert.alert('Error', 'Could not load profile.')).finally(() => setLoading(false));
  }, [id]);

  const handleMessage = async () => {
    if (!user || !profile) return;
    const convId = await chatApi.getOrCreateConversation(user.id, profile.id).catch(() => null);
    if (!convId) return;
    router.replace({ pathname: `/chat/${convId}`, params: { profileName: profile.display_name } });
  };

  const handleTap = async () => {
    if (!user || !profile || tapped || tapping) return;
    setTapping(true);
    await tapsApi.sendTap(user.id, profile.id).catch(() => {});
    setTapped(true);
    setTapping(false);
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View></SafeAreaView>;
  if (!profile) return null;

  const [fromColor, toColor] = getProfileGradient(profile.id);
  const photos = profile.photos || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Photo strip */}
        <View style={styles.photoStrip}>
          {photos.length > 0 ? (
            <Image source={{ uri: photos[activePhoto] }} style={styles.mainPhoto} contentFit="cover" />
          ) : (
            <LinearGradient colors={[fromColor, toColor]} style={styles.mainPhoto}>
              <Text style={styles.mainInitial}>{getInitial(profile.display_name)}</Text>
            </LinearGradient>
          )}
          {/* Photo dots */}
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <TouchableOpacity key={i} style={[styles.dot, i === activePhoto && styles.dotActive]} onPress={() => setActivePhoto(i)} />
              ))}
            </View>
          )}
          <LinearGradient colors={['transparent', Colors.bg]} style={styles.photoFade} />
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Identity row */}
        <View style={styles.identity}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.display_name}</Text>
              {profile.is_verified && <Text style={styles.verifiedBadge}>✓</Text>}
              {profile.is_premium && <Text style={styles.premiumBadge}>+</Text>}
            </View>
            <Text style={styles.meta}>{profile.age}{profile.city ? ` · ${profile.city}` : ''}{profile.distance_km ? ` · ${profile.distance_km}km` : ''}</Text>
          </View>
          <IntentPill mode={profile.intent_mode || 'Chat'} />
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Thumbnail photos */}
        {photos.length > 1 && (
          <View style={styles.thumbRow}>
            {photos.slice(1).map((url, i) => (
              <TouchableOpacity key={i} onPress={() => setActivePhoto(i + 1)} style={styles.thumb}>
                <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.tapBtn, tapped && styles.tapBtnActive]}
            onPress={handleTap}
            disabled={tapped || tapping}
            activeOpacity={0.8}
          >
            <Text style={styles.tapIcon}>✦</Text>
            <Text style={styles.tapLabel}>{tapped ? 'Tapped' : 'Tap'}</Text>
          </TouchableOpacity>
          <Button label="Message" variant="primary" style={{ flex: 1 }} onPress={handleMessage} />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.ice3, fontSize: Typography.base },
  photoStrip: { width, aspectRatio: 0.85, position: 'relative', overflow: 'hidden' },
  mainPhoto: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  mainInitial: { fontSize: 80, fontWeight: Typography.semibold, color: Colors.ice },
  dots: { position: 'absolute', top: Spacing.md, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.ice3, opacity: 0.5 },
  dotActive: { opacity: 1, backgroundColor: Colors.white },
  photoFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  closeBtn: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: Colors.white, fontSize: 13 },
  identity: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: Typography.semibold, color: Colors.ice },
  verifiedBadge: { fontSize: 12, color: Colors.accent, fontWeight: Typography.semibold },
  premiumBadge: { fontSize: 11, color: Colors.accent, fontWeight: Typography.semibold },
  meta: { fontSize: Typography.sm, color: Colors.ice3, marginTop: 3 },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  bio: { fontSize: Typography.base, color: Colors.ice2, lineHeight: 22 },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  thumb: { width: (width - Spacing.lg * 2 - 8) / 4, aspectRatio: 0.75, backgroundColor: Colors.surface2, borderRadius: Radius.sm, overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, marginTop: Spacing.xl, alignItems: 'center' },
  tapBtn: { width: 52, height: 52, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tapBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentBg },
  tapIcon: { fontSize: 16, color: Colors.accent },
  tapLabel: { fontSize: 8, color: Colors.accent, fontWeight: Typography.medium },
});
