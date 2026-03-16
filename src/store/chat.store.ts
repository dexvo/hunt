import { create } from 'zustand';
import type { Message, Conversation } from '@/src/types';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  setConversations: (convs: Conversation[]) => void;
  setMessages: (convId: string, msgs: Message[]) => void;
  addMessage: (convId: string, msg: Message) => void;
  markAsRead: (convId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},

  setConversations: (conversations) => set({ conversations }),

  setMessages: (convId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [convId]: msgs } })),

  addMessage: (convId, msg) =>
    set((s) => {
      const existing = s.messages[convId] || [];
      // Deduplicate by id
      if (existing.some((m) => m.id === msg.id)) return s;
      const updated = [...existing, msg];
      // Update conversation's last_message and unread count
      const conversations = s.conversations.map((c) => {
        if (c.id !== convId) return c;
        return { ...c, last_message: msg, updated_at: msg.created_at };
      });
      return { messages: { ...s.messages, [convId]: updated }, conversations };
    }),

  markAsRead: (convId, userId) =>
    set((s) => {
      const conversations = s.conversations.map((c) => {
        if (c.id !== convId) return c;
        return { ...c, unread_count: 0 };
      });
      const msgs = (s.messages[convId] || []).map((m) =>
        m.sender_id !== userId ? { ...m, is_read: true } : m
      );
      return { conversations, messages: { ...s.messages, [convId]: msgs } };
    }),
}));
