import { create } from 'zustand';
import { checkMembersPlus, onCustomerInfoUpdate } from '@lib/purchases';

interface SubState {
  isMembersPlus: boolean;
  isLoading: boolean;
  setMembersPlus: (val: boolean) => void;
  refresh: () => Promise<void>;
  startListening: () => () => void;
}

export const useSubStore = create<SubState>((set) => ({
  isMembersPlus: false,
  isLoading: true,

  setMembersPlus: (isMembersPlus) => set({ isMembersPlus, isLoading: false }),

  refresh: async () => {
    set({ isLoading: true });
    const active = await checkMembersPlus();
    set({ isMembersPlus: active, isLoading: false });
  },

  startListening: () => {
    return onCustomerInfoUpdate((info) => {
      const active = info.entitlements.active['members_plus'] !== undefined;
      set({ isMembersPlus: active });
    });
  },
}));
