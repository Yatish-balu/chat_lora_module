/**
 * uiStore.ts — Zustand store for UI state
 */

import { create } from 'zustand';
import type { LoRaStatusEvent } from '../types';

interface UIStore {
  isSidebarOpen: boolean;
  isMobileView: boolean;
  loraStatus: LoRaStatusEvent | null;
  loraConnected: boolean;
  dashboardStats: {
    onlineUsers: number;
    activeChats: number;
    messagesSent: number;
    messagesDelivered: number;
    messagesRead: number;
  };

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileView: (mobile: boolean) => void;
  setLoraStatus: (status: LoRaStatusEvent) => void;
  incrementStat: (stat: keyof UIStore['dashboardStats']) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  isMobileView: window.innerWidth < 768,
  loraStatus: null,
  loraConnected: false,
  dashboardStats: {
    onlineUsers: 0,
    activeChats: 0,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesRead: 0,
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setMobileView: (mobile) => set({ isMobileView: mobile }),

  setLoraStatus: (status) =>
    set({
      loraStatus: status,
      loraConnected: status.isConnected,
      dashboardStats: {
        onlineUsers: 0,
        activeChats: 0,
        messagesSent: status.stats.messagesSent,
        messagesDelivered: status.stats.messagesReceived,
        messagesRead: 0,
      },
    }),

  incrementStat: (stat) =>
    set((state) => ({
      dashboardStats: {
        ...state.dashboardStats,
        [stat]: state.dashboardStats[stat] + 1,
      },
    })),
}));
