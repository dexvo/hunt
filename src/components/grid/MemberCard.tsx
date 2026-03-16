import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius } from '@/src/constants/tokens';
import { Text } from '@/src/components/ui';
import { getInitial, getProfileGradient } from '@/src/utils/helpers';
import type { ProfileCard } from '@/src/types';

const CARD_SIZE = (Dimensions.get('window').width - 6) / 3;

interface MemberCardProps {
  profile: ProfileCard;
  onPress: () => void;
}

const INTENT_COLORS: Record<string, string> = {
  Now:    '#FF7B5F',
  Date:   '#7B8FFF',
  Chat:   '#5A6480',
  Travel: '#4FD1A5',
};

export function MemberCard({ profile, onPress }: MemberCardProps) {
  const hasPhoto = profile.photos && profile.photos.length > 0;
  const [from, to] = getProfileGradient(profile.id);
  const intentColor = INTENT_COLORS[profile.intent_mode] || Colors.ice3;

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
      {hasPhoto ? (
        <Image source={{ uri: profile.photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <LinearGradient colors={[from, to]} style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={styles.initial}>{getInitial(profile.display_name)}</Text>
        </LinearGradient>
      )}

      {/* Gradient overlay */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.gradient} />

      {/* Online dot */}
      {profile.is_online && <View style={styles.onlineDot} />}

      {/* Verified badge */}
      {profile.is_verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>}

      {/* Intent mode strip */}
      <View style={[styles.intentStrip, { backgroundColor: intentColor + '30', borderColor: intentColor + '80' }]}>
        <Text style={[styles.intentText, { color: intentColor }]}>{profile.intent_mode}</Text>
      </View>

      {/* Name + age */}
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>{profile.display_name.split(' ')[0]}</Text>
        <Text style={styles.age}>{profile.age}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_SIZE, height: CARD_SIZE * 1.35, backgroundColor: Colors.surface2, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 28, fontWeight: Typography.semibold as any, color: Colors.ice },
  gradient: { ...StyleSheet.absoluteFillObject, top: '40%' },
  onlineDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.online, borderWidth: 1, borderColor: Colors.surface1 },
  verifiedBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.accentBg, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  verifiedText: { fontSize: 7, color: Colors.accent, fontWeight: Typography.semibold as any },
  intentStrip: { position: 'absolute', bottom: 22, left: 4, right: 4, borderRadius: 3, borderWidth: 1, paddingVertical: 2, alignItems: 'center' },
  intentText: { fontSize: 7, fontWeight: Typography.semibold as any, letterSpacing: 0.5 },
  nameRow: { position: 'absolute', bottom: 5, left: 6, right: 6, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  name: { fontSize: 10, fontWeight: Typography.semibold as any, color: Colors.ice, flex: 1 },
  age: { fontSize: 9, color: Colors.ice2 },
});
