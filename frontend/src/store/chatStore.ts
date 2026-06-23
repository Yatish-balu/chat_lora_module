/**
 * chatStore.ts — Zustand store for chat and messaging state
 */

import { create } from 'zustand';
import type { Chat, Message, User, MessageStatus } from '../types';
import { chatsApi, messagesApi, usersApi } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

interface ChatStore {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>; // chatId → messages
  onlineUsers: User[];
  allUsers: User[];
  typingUsers: Record<string, string[]>; // chatId → usernames typing
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  searchResults: User[];
  isSearching: boolean;

  // Actions
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, mode: string) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (chatId: string, messageId: string, status: MessageStatus) => void;
  updateAllStatus: (chatId: string, status: MessageStatus) => void;
  setOnlineUsers: (users: User[]) => void;
  updateUserStatus: (userId: string, status: 'online' | 'away' | 'offline') => void;
  setTyping: (chatId: string, username: string, isTyping: boolean) => void;
  fetchAllUsers: () => Promise<void>;
  searchUsers: (q: string) => Promise<void>;
  clearSearch: () => void;
  openChatWithUser: (user: User) => Promise<Chat>;
  markActiveChatRead: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  onlineUsers: [],
  allUsers: [],
  typingUsers: {},
  isLoadingChats: false,
  isLoadingMessages: false,
  searchResults: [],
  isSearching: false,

  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const data = await chatsApi.getAll();
      set({ chats: data.chats, isLoadingChats: false });
    } catch (err) {
      console.error('fetchChats error:', err);
      set({ isLoadingChats: false });
    }
  },

  fetchMessages: async (chatId: string) => {
    set({ isLoadingMessages: true });
    try {
      const data = await messagesApi.getByChat(chatId);
      set((state) => ({
        messages: { ...state.messages, [chatId]: data.messages },
        isLoadingMessages: false,
      }));
    } catch (err) {
      console.error('fetchMessages error:', err);
      set({ isLoadingMessages: false });
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat });
  },

  // Optimistic message add (for immediate UI feedback)
  sendMessage: (content, mode) => {
    const state = get();
    const { activeChat } = state;
    if (!activeChat) return;

    // Message is sent via socket — handled in useSocket hook
    // This is just for optimistic UI updates
  },

  addMessage: (message: Message) => {
    const chatId = message.chat;
    set((state) => {
      const existing = state.messages[chatId] || [];
      // Dedup by _id or clientId
      const isDuplicate = existing.some(
        (m) => m._id === message._id || (message.clientId && m.clientId === message.clientId)
      );
      if (isDuplicate) return state;

      // Update chat's lastMessage
      const updatedChats = state.chats.map((c) =>
        c._id === chatId
          ? {
              ...c,
              lastMessage: {
                content: message.content,
                sender: message.sender,
                timestamp: message.createdAt,
                mode: message.mode,
              },
            }
          : c
      );

      return {
        messages: { ...state.messages, [chatId]: [...existing, message] },
        chats: updatedChats,
      };
    });
  },

  updateMessageStatus: (chatId, messageId, status) => {
    set((state) => {
      const msgs = state.messages[chatId];
      if (!msgs) return state;
      return {
        messages: {
          ...state.messages,
          [chatId]: msgs.map((m) =>
            m._id === messageId || m.clientId === messageId ? { ...m, status } : m
          ),
        },
      };
    });
  },

  updateAllStatus: (chatId, status) => {
    set((state) => {
      const msgs = state.messages[chatId];
      if (!msgs) return state;
      return {
        messages: {
          ...state.messages,
          [chatId]: msgs.map((m) =>
            ['pending', 'queued', 'sent', 'delivered'].includes(m.status)
              ? { ...m, status }
              : m
          ),
        },
      };
    });
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  updateUserStatus: (userId, status) => {
    set((state) => ({
      onlineUsers:
        status === 'offline'
          ? state.onlineUsers.filter((u) => u._id !== userId)
          : state.onlineUsers.map((u) => (u._id === userId ? { ...u, status } : u)),
      allUsers: state.allUsers.map((u) =>
        u._id === userId ? { ...u, status } : u
      ),
    }));
  },

  setTyping: (chatId, username, isTyping) => {
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      const updated = isTyping
        ? current.includes(username) ? current : [...current, username]
        : current.filter((u) => u !== username);
      return { typingUsers: { ...state.typingUsers, [chatId]: updated } };
    });
  },

  fetchAllUsers: async () => {
    try {
      const data = await usersApi.getAll();
      set({ allUsers: data.users });
    } catch (err) {
      console.error('fetchAllUsers error:', err);
    }
  },

  searchUsers: async (q: string) => {
    if (!q.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const data = await usersApi.search(q);
      set({ searchResults: data.users, isSearching: false });
    } catch {
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [], isSearching: false }),

  openChatWithUser: async (user: User) => {
    const data = await chatsApi.createOrGet(user._id);
    const chat = data.chat;

    set((state) => {
      const exists = state.chats.find((c) => c._id === chat._id);
      return {
        chats: exists ? state.chats : [chat, ...state.chats],
        activeChat: chat,
      };
    });

    return chat;
  },

  markActiveChatRead: () => {
    const { activeChat, messages } = get();
    if (!activeChat) return;
    messagesApi.markRead(activeChat._id).catch(() => {});
    // Reset unread in store
    set((state) => ({
      chats: state.chats.map((c) =>
        c._id === activeChat._id ? { ...c, myUnread: 0 } : c
      ),
    }));
  },
}));
