import { supabase } from '@lib/supabase';
import type { Profile, ProfileCard, GridFilters, Conversation, Message } from '@types/index';

export const profileApi = {
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Profile;
  },
  async update(id: string, updates: Partial<Profile>): Promise<void> {
    const { error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
  async updateIntentMode(id: string, mode: Profile['intent_mode']): Promise<void> {
    await profileApi.update(id, { intent_mode: mode });
  },
  async updateLocation(id: string, lat: number, lng: number): Promise<void> {
    await profileApi.update(id, { latitude: lat, longitude: lng });
  },
  async setOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await profileApi.update(id, { is_online: isOnline, last_seen: new Date().toISOString() });
  },
};

export const gridApi = {
  async getMembers(
    userLat: number, userLng: number,
    filters: GridFilters, page = 0, limit = 30
  ): Promise<ProfileCard[]> {
    const { data, error } = await supabase.rpc('get_nearby_profiles', {
      user_lat: userLat, user_lng: userLng,
      radius_km: filters.max_distance_km || 50,
      p_intent: filters.intent_mode || null,
      p_online: filters.online_only,
      p_verified: filters.verified_only,
      p_limit: limit, p_offset: page * limit,
    });
    if (error) throw error;
    return (data || []) as ProfileCard[];
  },
};

export const chatApi = {
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, updated_at, participants, messages(id, sender_id, type, content, duration_secs, is_read, created_at)')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });
    if (error) throw error;
    const results: Conversation[] = [];
    for (const conv of data || []) {
      const otherId = conv.participants.find((p: string) => p !== userId);
      if (!otherId) continue;
      const profile = await profileApi.getById(otherId).catch(() => null);
      if (!profile) continue;
      const msgs: Message[] = (conv.messages || []).sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const unread = msgs.filter((m) => m.sender_id !== userId && !m.is_read).length;
      results.push({ id: conv.id, participants: conv.participants, last_message: msgs[msgs.length - 1], unread_count: unread, other_profile: { id: profile.id, display_name: profile.display_name, age: profile.age, city: profile.city, photos: profile.photos, video_intro: profile.video_intro, is_verified: profile.is_verified, is_online: profile.is_online, intent_mode: profile.intent_mode, is_premium: profile.is_premium, distance_km: profile.distance_km }, updated_at: conv.updated_at });
    }
    return results;
  },
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) throw error;
    return data as Message[];
  },
  async sendMessage(conversationId: string, senderId: string, content: string, type: Message['type'] = 'text', durationSecs?: number): Promise<Message> {
    const { data, error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, type, content, duration_secs: durationSecs, is_read: false, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data as Message;
  },
  async getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
    const { data: existing } = await supabase.from('conversations').select('id').contains('participants', [userId, otherUserId]).maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await supabase.from('conversations').insert({ participants: [userId, otherUserId], updated_at: new Date().toISOString() }).select('id').single();
    if (error) throw error;
    return data.id;
  },
  async markRead(conversationId: string, userId: string): Promise<void> {
    await supabase.from('messages').update({ is_read: true }).eq('conversation_id', conversationId).neq('sender_id', userId).eq('is_read', false);
  },
  subscribeToMessages(conversationId: string, onMessage: (message: Message) => void) {
    return supabase.channel(`conv:${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => onMessage(payload.new as Message)).subscribe();
  },
};

export const tapsApi = {
  async sendTap(fromId: string, toId: string): Promise<void> {
    await supabase.from('taps').upsert({ from_profile_id: fromId, to_profile_id: toId, created_at: new Date().toISOString() });
  },
  async getTapCount(profileId: string): Promise<number> {
    const { count } = await supabase.from('taps').select('id', { count: 'exact', head: true }).eq('to_profile_id', profileId);
    return count || 0;
  },
  async getWhoTapped(profileId: string): Promise<string[]> {
    const { data } = await supabase.from('taps').select('from_profile_id').eq('to_profile_id', profileId).order('created_at', { ascending: false }).limit(50);
    return (data || []).map((t) => t.from_profile_id);
  },
};

export const storageApi = {
  async uploadPhoto(userId: string, uri: string, filename: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `${userId}/photos/${filename}`;
    const { error } = await supabase.storage.from('profile-media').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
    if (error) throw error;
    const { data } = supabase.storage.from('profile-media').getPublicUrl(path);
    return data.publicUrl;
  },
  async uploadVoiceNote(conversationId: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `voice/${conversationId}/${Date.now()}.m4a`;
    const { error } = await supabase.storage.from('chat-media').upload(path, blob, { contentType: 'audio/m4a' });
    if (error) throw error;
    const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
    return data.publicUrl;
  },
};
