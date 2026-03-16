import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/auth.store';
import { useGridStore } from '@/src/store/grid.store';
import { profileApi } from '@/src/lib/api';

export function useAuthSession() {
  const { setUser, setProfile, setLoading } = useAuthStore();
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as any);
        const profile = await profileApi.getById(session.user.id).catch(() => null);
        setProfile(profile);
      } else { setUser(null); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user as any);
        const profile = await profileApi.getById(session.user.id).catch(() => null);
        setProfile(profile);
      } else { setUser(null); setProfile(null); }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
}

export function useOnlinePresence() {
  const { user } = useAuthStore();
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    if (!user?.id) return;
    profileApi.setOnlineStatus(user.id, true);
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') profileApi.setOnlineStatus(user.id, true);
      else if (next !== 'active') profileApi.setOnlineStatus(user.id, false);
      appState.current = next;
    });
    return () => { sub.remove(); profileApi.setOnlineStatus(user.id, false); };
  }, [user?.id]);
}

export function useLocation() {
  const { user } = useAuthStore();
  const { setUserLocation } = useGridStore();
  useEffect(() => {
    if (!user?.id) return;
    let locationSub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation(initial.coords.latitude, initial.coords.longitude);
      profileApi.updateLocation(user.id, initial.coords.latitude, initial.coords.longitude);
      locationSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 60000, distanceInterval: 100 },
        (loc) => {
          setUserLocation(loc.coords.latitude, loc.coords.longitude);
          profileApi.updateLocation(user.id, loc.coords.latitude, loc.coords.longitude);
        }
      );
    })();
    return () => { locationSub?.remove(); };
  }, [user?.id]);
}

export function useRealtimeMessages(conversationId: string | null, onMessage: (msg: any) => void) {
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`conv:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (p) => onMessage(p.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);
}

export function useRealtimeConversations(userId: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`user_convs:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onUpdate)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
}
