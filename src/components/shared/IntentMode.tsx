import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text } from '@/src/components/ui';
import type { IntentMode } from '@/src/types';

const INTENTS: { mode: IntentMode; icon: string; label: string; color: string }[] = [
  { mode: 'Now',    icon: '⚡', label: 'Now',    color: '#FF7B5F' },
  { mode: 'Date',   icon: '◆', label: 'Date',   color: Colors.accent },
  { mode: 'Chat',   icon: '◻', label: 'Chat',   color: Colors.ice3 },
  { mode: 'Travel', icon: '✈', label: 'Travel', color: Colors.success },
];

// Small pill shown on profile card / header
export function IntentPill({ mode }: { mode: IntentMode }) {
  const intent = INTENTS.find((i) => i.mode === mode) || INTENTS[2];
  return (
    <View style={[styles.pill, { borderColor: intent.color + '60' }]}>
      <Text style={[styles.pillText, { color: intent.color }]}>{intent.icon} {intent.label}</Text>
    </View>
  );
}

// Full row of intent filter buttons (grid top)
export function IntentFilterRow({ selected, onSelect }: { selected: IntentMode | null; onSelect: (mode: IntentMode | null) => void }) {
  return (
    <View style={styles.filterRow}>
      {INTENTS.map(({ mode, icon, label, color }) => {
        const active = selected === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[styles.filterBtn, active && { backgroundColor: color + '20', borderColor: color + '80' }]}
            onPress={() => onSelect(active ? null : mode)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, active && { color }]}>{icon} {label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Full intent selector (profile edit)
export function IntentSelector({ selected, onChange }: { selected: IntentMode; onChange: (mode: IntentMode) => void }) {
  return (
    <View style={styles.selectorRow}>
      {INTENTS.map(({ mode, icon, label, color }) => {
        const active = selected === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[styles.selectorBtn, active && { backgroundColor: color + '20', borderColor: color + '80' }]}
            onPress={() => onChange(mode)}
            activeOpacity={0.75}
          >
            <Text style={[styles.selectorIcon, { color: active ? color : Colors.ice3 }]}>{icon}</Text>
            <Text style={[styles.selectorLabel, { color: active ? color : Colors.ice3 }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  pillText: { fontSize: Typography.xs, fontWeight: Typography.semibold as any },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface2 },
  filterText: { fontSize: Typography.xs, fontWeight: Typography.medium as any, color: Colors.ice3 },
  selectorRow: { flexDirection: 'row', gap: 8 },
  selectorBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface2, gap: 4 },
  selectorIcon: { fontSize: 18 },
  selectorLabel: { fontSize: Typography.xs, fontWeight: Typography.medium as any },
});
