import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/src/constants/tokens';
import { Text } from '@/src/components/ui';
import { useChatStore } from '@/src/store/chat.store';
import { useAuthStore } from '@/src/store/auth.store';

function TabIcon({ symbol, label, focused }: { symbol: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tab}>
      <Text style={[styles.symbol, focused && styles.symbolActive]}>{symbol}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

function MessagesTabIcon({ focused }: { focused: boolean }) {
  const unread = useChatStore((s) => s.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0));
  return (
    <View style={styles.tab}>
      <View>
        <Text style={[styles.symbol, focused && styles.symbolActive]}>◻</Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>Messages</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.is_admin === true;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.ice3,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index"    options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="⊞" label="Members" focused={focused} /> }} />
      <Tabs.Screen name="messages" options={{ tabBarIcon: ({ focused }) => <MessagesTabIcon focused={focused} /> }} />
      <Tabs.Screen name="explore"  options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="◎" label="Explore" focused={focused} /> }} />
      <Tabs.Screen name="profile"  options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="○" label="Profile" focused={focused} /> }} />
      <Tabs.Screen
        name="admin"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon symbol="◆" label="Admin" focused={focused} />,
          tabBarStyle: isAdmin ? styles.bar : { display: 'none' },
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Colors.surface1, borderTopColor: Colors.border2, borderTopWidth: 1, height: 68, paddingBottom: 10 },
  tab: { alignItems: 'center', gap: 2 },
  symbol: { fontSize: 18, color: Colors.ice3 },
  symbolActive: { color: Colors.accent },
  label: { fontSize: 8, fontWeight: Typography.medium as any, color: Colors.ice3, letterSpacing: 1, textTransform: 'uppercase' },
  labelActive: { color: Colors.accent },
  badge: { position: 'absolute', top: -3, right: -8, backgroundColor: Colors.accent, borderRadius: 7, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  badgeText: { fontSize: 7, fontWeight: Typography.semibold as any, color: Colors.white },
});
