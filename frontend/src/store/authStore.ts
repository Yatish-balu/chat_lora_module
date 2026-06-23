/**
 * authStore.ts — Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CommunicationMode, LoginCredentials, RegisterCredentials } from '../types';
import { authApi } from '../services/api';
import { connectSocket, disconnectSocket } from '../socket/socket';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: CommunicationMode;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setMode: (mode: CommunicationMode) => void;
  restoreSession: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mode: 'online',

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(credentials);
          const { token, user } = data;

          localStorage.setItem('ag_token', token);
          localStorage.setItem('ag_user', JSON.stringify(user));

          connectSocket(token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            mode: user.preferredMode || 'online',
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await authApi.register(credentials);
          const { token, user } = data;

          localStorage.setItem('ag_token', token);
          localStorage.setItem('ag_user', JSON.stringify(user));

          connectSocket(token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            mode: 'online',
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Silent fail — still clear local state
        }
        disconnectSocket();
        localStorage.removeItem('ag_token');
        localStorage.removeItem('ag_user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          mode: 'online',
        });
      },

      setMode: (mode) => {
        set({ mode });
        // Persist preferred mode
        authApi.updateProfile({ preferredMode: mode } as Partial<User>).catch(() => {});
      },

      restoreSession: () => {
        const token = localStorage.getItem('ag_token');
        const userStr = localStorage.getItem('ag_user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr) as User;
            connectSocket(token);
            set({ user, token, isAuthenticated: true });
          } catch {
            localStorage.removeItem('ag_token');
            localStorage.removeItem('ag_user');
          }
        }
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          const updated = { ...current, ...partial };
          set({ user: updated });
          localStorage.setItem('ag_user', JSON.stringify(updated));
        }
      },
    }),
    {
      name: 'ag-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        mode: state.mode,
      }),
    }
  )
);
