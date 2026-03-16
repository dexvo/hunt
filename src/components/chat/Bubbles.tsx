import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text } from '@/src/components/ui';
import { formatRelativeTime } from '@/src/utils/helpers';
import type { Message, IntentMode } from '@/src/types';

// ── TEXT BUBBLE ───────────────────────────────────────────
export function TextBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <View style={[styles.bubbleWrap, isMine && styles.bubbleWrapMine]}>
      <View style={[styles.textBubble, isMine ? styles.textBubbleMine : styles.textBubbleTheirs]}>
        <Text style={[styles.bubbleText, isMine && { color: Colors.ice }]}>{message.content}</Text>
      </View>
      <Text style={[styles.time, isMine && { textAlign: 'right' }]}>{formatRelativeTime(message.created_at)}</Text>
    </View>
  );
}

// ── IMAGE BUBBLE ──────────────────────────────────────────
export function ImageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <View style={[styles.bubbleWrap, isMine && styles.bubbleWrapMine]}>
      <Image source={{ uri: message.content }} style={styles.imageBubble} contentFit="cover" />
      <Text style={[styles.time, isMine && { textAlign: 'right' }]}>{formatRelativeTime(message.created_at)}</Text>
    </View>
  );
}

// ── DATE SEPARATOR ────────────────────────────────────────
export function DateSeparator({ date }: { date: string }) {
  return (
    <View style={styles.dateSep}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{date}</Text>
      <View style={styles.dateLine} />
    </View>
  );
}

// ── ICEBREAKER CARD ───────────────────────────────────────
export function IcebreakerCard({ suggestions, onSelect }: { suggestions: string[]; onSelect: (text: string) => void }) {
  return (
    <View style={styles.iceBreakerCard}>
      <Text style={styles.iceTitle}>Break the ice</Text>
      <View style={styles.iceSuggestions}>
        {suggestions.map((s) => (
          <TouchableOpacity key={s} style={styles.icePill} onPress={() => onSelect(s)} activeOpacity={0.75}>
            <Text style={styles.icePillText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── INTENT BANNER ─────────────────────────────────────────
const INTENT_COLORS: Record<string, string> = {
  Now:    '#FF7B5F',
  Date:   '#7B8FFF',
  Chat:   '#5A6480',
  Travel: '#4FD1A5',
};

export function IntentBanner({ name, mode }: { name: string; mode: IntentMode }) {
  const color = INTENT_COLORS[mode] || Colors.ice3;
  return (
    <View style={[styles.intentBanner, { borderColor: color + '50' }]}>
      <Text style={[styles.intentBannerText, { color }]}>{name} is here for · {mode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrap:      { maxWidth: '78%', gap: 3 },
  bubbleWrapMine:  { alignSelf: 'flex-end' },
  textBubble:      { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.lg },
  textBubbleTheirs:{ backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: Radius.sm },
  textBubbleMine:  { backgroundColor: Colors.accentBg, borderWidth: 1, borderColor: Colors.accentBorder, borderBottomRightRadius: Radius.sm },
  bubbleText:      { fontSize: Typography.base, color: Colors.ice2, lineHeight: 20 },
  imageBubble:     { width: 220, height: 280, borderRadius: Radius.lg, overflow: 'hidden' },
  time:            { fontSize: Typography.xs, color: Colors.ice3 },
  dateSep:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
  dateLine:        { flex: 1, height: 1, backgroundColor: Colors.border },
  dateText:        { fontSize: Typography.xs, color: Colors.ice3 },
  iceBreakerCard:  { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  iceTitle:        { fontSize: Typography.xs, color: Colors.ice3, fontWeight: Typography.semibold as any, letterSpacing: 1, textTransform: 'uppercase' },
  iceSuggestions:  { gap: 6 },
  icePill:         { borderWidth: 1, borderColor: Colors.accentBorder, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.accentBg },
  icePillText:     { fontSize: Typography.sm, color: Colors.accent },
  intentBanner:    { alignSelf: 'center', borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.md },
  intentBannerText:{ fontSize: Typography.xs, fontWeight: Typography.medium as any, letterSpacing: 0.5 },
});
