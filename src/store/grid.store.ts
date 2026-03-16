import { create } from 'zustand';
import type { ProfileCard, GridFilters, IntentMode } from '@types/index';

interface GridState {
  members: ProfileCard[];
  filters: GridFilters;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  userLat: number;
  userLng: number;
  setMembers: (members: ProfileCard[]) => void;
  appendMembers: (members: ProfileCard[]) => void;
  setFilters: (filters: Partial<GridFilters>) => void;
  setIntentFilter: (mode: IntentMode | null) => void;
  setUserLocation: (lat: number, lng: number) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  resetGrid: () => void;
}

const DEFAULT_FILTERS: GridFilters = {
  intent_mode: null,
  online_only: false,
  verified_only: false,
  members_plus: false,
  max_distance_km: 50,
};

export const useGridStore = create<GridState>((set) => ({
  members: [],
  filters: DEFAULT_FILTERS,
  isLoading: false,
  hasMore: true,
  page: 0,
  userLat: 0,
  userLng: 0,
  setMembers: (members) => set({ members, page: 1 }),
  appendMembers: (members) => set((s) => ({ members: [...s.members, ...members], page: s.page + 1 })),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters }, members: [], page: 0 })),
  setIntentFilter: (mode) => set((s) => ({ filters: { ...s.filters, intent_mode: mode }, members: [], page: 0 })),
  setUserLocation: (userLat, userLng) => set({ userLat, userLng }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),
  resetGrid: () => set({ members: [], page: 0, hasMore: true }),
}));
