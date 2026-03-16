import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/auth.store';

type Tab = 'queue' | 'users' | 'stats';

interface PendingProfile {
  id: string;
  display_name: string;
  age: number;
  phone: string;
  verification_selfie: string;
  photos: string[];
  created_at: string;
}

interface UserProfile {
  id: string;
  display_name: string;
  age: number;
  city: string;
  is_verified: boolean;
  is_premium: boolean;
  is_incognito: boolean;
  verification_status: string;
  photos: string[];
  verification_selfie: string;
  created_at: string;
}

export default function AdminScreen() {
  const { profile } = useAuthStore();
  const [tab, setTab] = useState<Tab>('queue');
  const [queue, setQueue] = useState<PendingProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, premium: 0, pending: 0, today: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, age, verification_selfie, photos, created_at')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });
    setQueue((data || []) as PendingProfile[]);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, age, city, is_verified, is_premium, is_incognito, verification_status, photos, verification_selfie, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setUsers((data || []) as UserProfile[]);
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, verified, premium, pending, todayCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);
    setStats({
      total: total.count || 0,
      verified: verified.count || 0,
      premium: premium.count || 0,
      pending: pending.count || 0,
      today: todayCount.count || 0,
    });
  }, []);

  useEffect(() => {
    if (tab === 'queue') loadQueue();
    else if (tab === 'users') loadUsers();
    else loadStats();
  }, [tab]);

  const handleApprove = async (userId: string) => {
    await supabase.from('profiles').update({ is_verified: true, verification_status: 'approved' }).eq('id', userId);
    setQueue((q) => q.filter((p) => p.id !== userId));
    Alert.alert('Approved', 'Profile is now live.');
  };

  const handleReject = async (userId: string) => {
    Alert.alert('Reject profile', 'This will remove them from the queue. They can resubmit.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          await supabase.from('profiles').update({ verification_status: 'rejected' }).eq('id', userId);
          setQueue((q) => q.filter((p) => p.id !== userId));
        }
      }
    ]);
  };

  const handleBan = async (userId: string) => {
    Alert.alert('Ban user', 'This will immediately remove them from the grid.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Ban', style: 'destructive', onPress: async () => {
          await supabase.from('profiles').update({ is_incognito: true, verification_status: 'banned' }).eq('id', userId);
          setUsers((u) => u.map((p) => p.id === userId ? { ...p, is_incognito: true, verification_status: 'banned' } : p));
          setSelectedUser(null);
        }
      }
    ]);
  };

  const handleGrantBlack = async (userId: string, current: boolean) => {
    await supabase.from('profiles').update({ is_premium: !current }).eq('id', userId);
    setUsers((u) => u.map((p) => p.id === userId ? { ...p, is_premium: !current } : p));
    if (selectedUser?.id === userId) setSelectedUser((s) => s ? { ...s, is_premium: !current } : null);
  };

  const getSelfieUrl = (path: string) => {
    if (!path) return null;
    const { data } = supabase.storage.from('verification-media').getPublicUrl(path);
    return data.publicUrl;
  };

  // User detail modal
  if (selectedUser) {
    const selfieUrl = selectedUser.verification_selfie ? getSelfieUrl(selectedUser.verification_selfie) : null;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text variant="h3">{selectedUser.display_name}, {selectedUser.age}</Text>
          <Text variant="sm">{selectedUser.city} · {selectedUser.verification_status}</Text>

          <View style={styles.photoRow}>
            {selfieUrl && (
              <View style={styles.photoWrap}>
                <Image source={{ uri: selfieUrl }} style={styles.photo} contentFit="cover" />
                <Text style={styles.photoLabel}>Verification selfie</Text>
              </View>
            )}
            {selectedUser.photos?.[0] && (
              <View style={styles.photoWrap}>
                <Image source={{ uri: selectedUser.photos[0] }} style={styles.photo} contentFit="cover" />
                <Text style={styles.photoLabel}>Profile photo</Text>
              </View>
            )}
          </View>

          <View style={styles.statRow}>
            {[
              { label: 'Verified', val: selectedUser.is_verified ? 'Yes' : 'No' },
              { label: 'LYNX Black', val: selectedUser.is_premium ? 'Yes' : 'No' },
              { label: 'Incognito', val: selectedUser.is_incognito ? 'Yes' : 'No' },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statVal}>{s.val}</Text>
              </View>
            ))}
          </View>

          <Button label={selectedUser.is_premium ? 'Revoke LYNX Black' : 'Grant LYNX Black'} variant="secondary" onPress={() => handleGrantBlack(selectedUser.id, selectedUser.is_premium)} />
          <Button label="Ban user" variant="danger" onPress={() => handleBan(selectedUser.id)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h3">Admin</Text>
        <Text style={styles.adminBadge}>◆ LYNX Admin</Text>
      </View>

      <View style={styles.tabs}>
        {(['queue', 'users', 'stats'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'queue' ? `Queue${stats.pending > 0 ? ` (${stats.pending})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'queue' && (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
          refreshing={loading}
          onRefresh={loadQueue}
          renderItem={({ item }) => {
            const selfieUrl = item.verification_selfie ? getSelfieUrl(item.verification_selfie) : null;
            return (
              <View style={styles.queueCard}>
                <View style={styles.queuePhotos}>
                  {selfieUrl && <Image source={{ uri: selfieUrl }} style={styles.queuePhoto} contentFit="cover" />}
                  {item.photos?.[0] && <Image source={{ uri: item.photos[0] }} style={styles.queuePhoto} contentFit="cover" />}
                </View>
                <View style={styles.queueInfo}>
                  <Text style={styles.queueName}>{item.display_name}, {item.age}</Text>
                  <Text style={styles.queueSub}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.queueActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                    <Text style={styles.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                    <Text style={styles.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{loading ? 'Loading…' : 'Queue is empty'}</Text>
            </View>
          }
        />
      )}

      {tab === 'users' && (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}
          refreshing={loading}
          onRefresh={loadUsers}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userRow} onPress={() => setSelectedUser(item)} activeOpacity={0.7}>
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={styles.userAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.userAvatar, { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: Colors.ice3 }}>{item.display_name?.charAt(0)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.display_name}, {item.age}</Text>
                <Text style={styles.userMeta}>{item.verification_status} · {item.city}</Text>
              </View>
              <View style={styles.userBadges}>
                {item.is_verified && <Text style={styles.badge}>✓</Text>}
                {item.is_premium && <Text style={[styles.badge, { color: Colors.accent }]}>B</Text>}
                {item.is_incognito && <Text style={[styles.badge, { color: Colors.error }]}>H</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {tab === 'stats' && (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
          {[
            { label: 'Total users', val: stats.total },
            { label: 'Verified profiles', val: stats.verified },
            { label: 'LYNX Black subscribers', val: stats.premium },
            { label: 'Pending verification', val: stats.pending },
            { label: 'Joined today', val: stats.today },
            { label: 'Conversion rate', val: stats.total > 0 ? `${Math.round((stats.premium / stats.total) * 100)}%` : '0%' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statCardLabel}>{s.label}</Text>
              <Text style={styles.statCardVal}>{s.val}</Text>
            </View>
          ))}
          <Button label="Refresh" variant="secondary" onPress={loadStats} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  adminBadge: { fontSize: Typography.xs, color: Colors.accent, fontWeight: Typography.semibold as any },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border2 },
  tabBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { fontSize: Typography.sm, color: Colors.ice3 },
  tabTextActive: { color: Colors.accent, fontWeight: Typography.semibold as any },
  queueCard: { backgroundColor: Colors.surface2, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md },
  queuePhotos: { flexDirection: 'row', gap: Spacing.sm },
  queuePhoto: { width: 80, height: 100, borderRadius: Radius.md, backgroundColor: Colors.surface3 },
  queueInfo: { gap: 4 },
  queueName: { fontSize: Typography.base, fontWeight: Typography.semibold as any, color: Colors.ice },
  queueSub: { fontSize: Typography.xs, color: Colors.ice3 },
  queueActions: { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: { flex: 1, backgroundColor: Colors.success + '20', borderWidth: 1, borderColor: Colors.success + '60', borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  approveBtnText: { fontSize: Typography.sm, color: Colors.success, fontWeight: Typography.semibold as any },
  rejectBtn: { flex: 1, backgroundColor: Colors.error + '20', borderWidth: 1, borderColor: Colors.error + '60', borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  rejectBtnText: { fontSize: Typography.sm, color: Colors.error, fontWeight: Typography.semibold as any },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.ice3, fontSize: Typography.base },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surface2, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  userAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  userName: { fontSize: Typography.base, fontWeight: Typography.medium as any, color: Colors.ice },
  userMeta: { fontSize: Typography.xs, color: Colors.ice3 },
  userBadges: { flexDirection: 'row', gap: 4 },
  badge: { fontSize: Typography.xs, fontWeight: Typography.semibold as any, color: Colors.success },
  statCard: { backgroundColor: Colors.surface2, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCardLabel: { fontSize: Typography.base, color: Colors.ice2 },
  statCardVal: { fontSize: Typography['2xl'], fontWeight: Typography.semibold as any, color: Colors.ice },
  backBtn: { paddingVertical: Spacing.sm },
  backText: { fontSize: Typography.base, color: Colors.accent },
  photoRow: { flexDirection: 'row', gap: Spacing.md },
  photoWrap: { gap: 6 },
  photo: { width: 140, height: 180, borderRadius: Radius.md },
  photoLabel: { fontSize: Typography.xs, color: Colors.ice3, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  statItem: { flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: Typography.xs, color: Colors.ice3 },
  statVal: { fontSize: Typography.base, fontWeight: Typography.semibold as any, color: Colors.ice },
});
