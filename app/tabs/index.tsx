import React, { useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/src/constants/tokens';
import { Text } from '@/src/components/ui';
import { MemberCard } from '@/src/components/grid/MemberCard';
import { IntentFilterRow } from '@/src/components/shared/IntentMode';
import { useAuthStore } from '@/src/store/auth.store';
import { useGridStore } from '@/src/store/grid.store';
import { gridApi } from '@/src/lib/api';
import type { IntentMode } from '@/src/types';

export default function MembersScreen() {
  const { user } = useAuthStore();
  const {
    members, filters, isLoading, hasMore, userLat, userLng,
    setMembers, appendMembers, setIntentFilter, setLoading, setHasMore, resetGrid,
  } = useGridStore();

  const load = useCallback(async (reset = false) => {
    if (!user || (!userLat && !userLng)) return;
    setLoading(true);
    try {
      const page = reset ? 0 : Math.floor(members.length / 30);
      const data = await gridApi.getMembers(userLat, userLng, filters, page, 30);
      if (reset) setMembers(data);
      else appendMembers(data);
      setHasMore(data.length === 30);
    } catch (e) {
      console.error('Grid load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, filters, members.length, userLat, userLng]);

  useEffect(() => {
    if (userLat || userLng) { resetGrid(); load(true); }
  }, [filters, userLat, userLng]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>BREEDX</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconText}>⊟</Text></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconText}>○</Text></TouchableOpacity>
        </View>
      </View>

      <IntentFilterRow selected={filters.intent_mode || null} onSelect={(mode: IntentMode | null) => setIntentFilter(mode)} />

      <View style={styles.chipsRow}>
        {['Online', 'Verified'].map((label) => {
          const key = `${label.toLowerCase()}_only` as any;
          const active = filters[key];
          return (
            <TouchableOpacity
              key={label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => useGridStore.getState().setFilters({ [key]: !active })}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.chip, filters.members_plus && styles.chipActive]}
          onPress={() => useGridStore.getState().setFilters({ members_plus: !filters.members_plus })}
        >
          <Text style={[styles.chipText, filters.members_plus && styles.chipTextActive]}>BREEDX Black</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <MemberCard profile={item} onPress={() => router.push(`/member/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading && members.length === 0} onRefresh={() => load(true)} tintColor={Colors.accent} />
        }
        onEndReached={() => { if (hasMore && !isLoading) load(); }}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No members nearby</Text>
              <Text variant="sm" color={Colors.ice3}>Try expanding your filters</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  logo: { fontSize: 17, fontWeight: '600', letterSpacing: 5, color: Colors.ice },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  iconText: { fontSize: 18, color: Colors.ice3 },
  chipsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.lg, paddingTop: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.accentBg, borderColor: Colors.accentBorder },
  chipText: { fontSize: 10, fontWeight: '500', color: Colors.ice3 },
  chipTextActive: { color: Colors.accent },
  grid: { padding: 2, gap: 2 },
  row: { gap: 2 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.ice2 },
});
