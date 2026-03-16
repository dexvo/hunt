import React, { useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth.store';
import { useChatStore } from '@/src/store/chat.store';
import { chatApi } from '@/src/lib/api';
import { useRealtimeConversations } from '@/src/hooks';
import { formatRelativeTime, getInitial, getProfileGradient } from '@/src/utils/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import type { Conversation } from '@/src/types';

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const { conversations, setConversations } = useChatStore();

  const load = useCallback(async () => {
    if (!user) return;
    const data = await chatApi.getConversations(user.id).catch(() => []);
    setConversations(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useRealtimeConversations(user?.id || null, load);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const p = item.other_profile;
    const hasPhoto = p.photos && p.photos.length > 0;
    const [from, to] = getProfileGradient(p.id);
    const lastMsg = item.last_message;
    const preview = lastMsg?.type === 'voice' ? '🎤 Voice message' : lastMsg?.type === 'image' ? '📷 Photo' : (lastMsg?.content || '');
    const unread = item.unread_count > 0;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push({ pathname: `/chat/${item.id}`, params: { profileName: p.display_name } })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          {hasPhoto ? (
            <Image source={{ uri: p.photos[0] }} style={styles.avatar} contentFit="cover" />
          ) : (
            <LinearGradient colors={[from, to]} style={styles.avatar}>
              <Text style={styles.avatarInitial}>{getInitial(p.display_name)}</Text>
            </LinearGradient>
          )}
          {p.is_online && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.info}>
          <View style={styles.infoTop}>
            <Text style={[styles.name, unread && styles.nameUnread]}>{p.display_name}</Text>
            <Text style={styles.time}>{lastMsg ? formatRelativeTime(lastMsg.created_at) : ''}</Text>
          </View>
          <View style={styles.infoBottom}>
            <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
              {preview || 'Tap to start chatting'}
            </Text>
            {unread && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread_count}</Text></View>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="h3">Messages</Text>
          {totalUnread > 0 && <Text style={styles.unreadSub}>{totalUnread} unread</Text>}
        </View>
        <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconText}>✎</Text></TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text variant="sm" color={Colors.ice3}>Tap someone in the grid to start chatting</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border2 },
  unreadSub: { fontSize: 10, color: Colors.accent, marginTop: 2 },
  iconBtn: { padding: 6 },
  iconText: { fontSize: 18, color: Colors.ice3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border2 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface2 },
  avatarInitial: { fontSize: 20, fontWeight: Typography.semibold, color: Colors.ice },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent, borderWidth: 1.5, borderColor: Colors.surface1 },
  info: { flex: 1 },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: Typography.base, fontWeight: Typography.regular, color: Colors.ice2 },
  nameUnread: { fontWeight: Typography.semibold, color: Colors.ice },
  time: { fontSize: 10, color: Colors.ice3 },
  infoBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  preview: { fontSize: Typography.sm, color: Colors.ice3, flex: 1, marginRight: 8 },
  previewUnread: { color: Colors.ice2 },
  badge: { backgroundColor: Colors.accent, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 9, fontWeight: Typography.semibold, color: Colors.white },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.medium, color: Colors.ice2 },
});
