/**
 * API Service Layer
 * ─────────────────────────────────────────────────────────────
 * Axios instance with JWT auth injection and error handling.
 * All API calls go through this module.
 * ─────────────────────────────────────────────────────────────
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  ChatsResponse,
  MessagesResponse,
  UsersResponse,
  User,
  Chat,
  Message,
  LoginCredentials,
  RegisterCredentials,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─── Request interceptor — inject JWT ─── */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ag_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ─── Response interceptor — handle 401 ─── */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage and redirect to login
      localStorage.removeItem('ag_token');
      localStorage.removeItem('ag_user');
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────────────────────────
   Auth API
   ───────────────────────────────────────────────────────────── */
export const authApi = {
  register: async (data: RegisterCredentials): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginCredentials): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    const res = await api.get('/auth/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

/* ─────────────────────────────────────────────────────────────
   Users API
   ───────────────────────────────────────────────────────────── */
export const usersApi = {
  getAll: async (): Promise<UsersResponse> => {
    const res = await api.get<UsersResponse>('/users');
    return res.data;
  },

  search: async (q: string): Promise<UsersResponse> => {
    const res = await api.get<UsersResponse>(`/users/search?q=${encodeURIComponent(q)}`);
    return res.data;
  },

  getOnline: async (): Promise<UsersResponse> => {
    const res = await api.get<UsersResponse>('/users/online');
    return res.data;
  },

  getById: async (id: string): Promise<{ success: boolean; user: User }> => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
};

/* ─────────────────────────────────────────────────────────────
   Chats API
   ───────────────────────────────────────────────────────────── */
export const chatsApi = {
  getAll: async (): Promise<ChatsResponse> => {
    const res = await api.get<ChatsResponse>('/chats');
    return res.data;
  },

  createOrGet: async (userId: string): Promise<{ success: boolean; chat: Chat }> => {
    const res = await api.post('/chats', { userId });
    return res.data;
  },

  delete: async (chatId: string): Promise<void> => {
    await api.delete(`/chats/${chatId}`);
  },
};

/* ─────────────────────────────────────────────────────────────
   Messages API
   ───────────────────────────────────────────────────────────── */
export const messagesApi = {
  getByChat: async (chatId: string, page = 1, limit = 50): Promise<MessagesResponse> => {
    const res = await api.get<MessagesResponse>(`/messages/${chatId}?page=${page}&limit=${limit}`);
    return res.data;
  },

  send: async (data: {
    chatId: string;
    receiverId: string;
    content: string;
    mode?: string;
    replyTo?: string;
    clientId?: string;
  }): Promise<{ success: boolean; message: Message }> => {
    const res = await api.post('/messages/send', data);
    return res.data;
  },

  markRead: async (chatId: string): Promise<void> => {
    await api.post('/messages/read', { chatId });
  },

  markDelivered: async (chatId: string): Promise<void> => {
    await api.post('/messages/delivered', { chatId });
  },

  delete: async (messageId: string): Promise<void> => {
    await api.delete(`/messages/${messageId}`);
  },
};

/* ─── LoRa Status ─── */
export const loraApi = {
  getStatus: async () => {
    const res = await api.get('/lora/status');
    return res.data;
  },
};

export default api;
