import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import type { Profile, User } from '@/src/types';
import { profileApi } from '@/src/lib/api';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await profileApi.getById(user.id).catch(() => null);
    set({ profile });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
