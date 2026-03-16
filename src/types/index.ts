export type IntentMode = 'Now' | 'Date' | 'Chat' | 'Travel';

export interface Profile {
  id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
  video_intro: string | null;
  is_verified: boolean;
  is_online: boolean;
  is_premium: boolean;
  is_incognito: boolean;
  intent_mode: IntentMode;
  latitude: number | null;
  longitude: number | null;
  distance_km?: number;
  is_admin: boolean;
  verification_status: string;
  verification_selfie: string | null;
  last_seen: string;
  updated_at: string;
}

export interface ProfileCard {
  id: string;
  display_name: string;
  age: number;
  city: string;
  photos: string[];
  video_intro: string | null;
  is_verified: boolean;
  is_online: boolean;
  intent_mode: IntentMode;
  is_premium: boolean;
  distance_km: number;
}

export interface GridFilters {
  intent_mode: IntentMode | null;
  online_only: boolean;
  verified_only: boolean;
  members_plus: boolean;
  max_distance_km: number;
}

export type MessageType = 'text' | 'image' | 'voice';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  duration_secs?: number;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message: Message | null;
  unread_count: number;
  other_profile: ProfileCard;
  updated_at: string;
}

export interface User {
  id: string;
  phone: string;
  created_at: string;
}
