/* ─────────────────────────────────────────────────────────────
   Chatter — Global TypeScript Types
   ───────────────────────────────────────────────────────────── */

export type UserStatus = 'online' | 'away' | 'offline';
export type CommunicationMode = 'online' | 'lora' | 'hybrid';
export type MessageStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatType = 'direct' | 'group';

/* ─── User ─────────────────────────────────────────────────── */
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  displayName: string;
  status: UserStatus;
  lastSeen: string;
  preferredMode?: CommunicationMode;
  createdAt: string;
}

/* ─── Auth ─────────────────────────────────────────────────── */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

/* ─── Message ──────────────────────────────────────────────── */
export interface LoRaMetadata {
  rssi: number | null;
  msgId: string | null;
  ackReceived: boolean;
  retries: number;
}

export interface Message {
  _id: string;
  chat: string;
  sender: User;
  receiver: User;
  content: string;
  mode: CommunicationMode;
  status: MessageStatus;
  loraMetadata?: LoRaMetadata;
  replyTo?: Message | null;
  deletedFor?: string[];
  clientId?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Chat ─────────────────────────────────────────────────── */
export interface LastMessage {
  content: string;
  sender: User | string | null;
  timestamp: string;
  mode: CommunicationMode;
}

export interface Chat {
  _id: string;
  chatType: ChatType;
  participants: User[];
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: LastMessage;
  unreadCounts?: Record<string, number>;
  myUnread?: number;
  createdAt: string;
  updatedAt: string;
}

/* ─── Socket Events ────────────────────────────────────────── */
export interface SocketMessage extends Message {}

export interface TypingEvent {
  userId: string;
  username: string;
  chatId: string;
}

export interface UserOnlineEvent {
  userId: string;
  username: string;
  avatar: string;
  status: UserStatus;
}

export interface UserOfflineEvent {
  userId: string;
  username: string;
  lastSeen: string;
  status: 'offline';
}

export interface MessageStatusEvent {
  messageId?: string;
  chatId: string;
  receiverId?: string;
  readerId?: string;
  status?: MessageStatus;
}

export interface LoRaStatusEvent {
  isConnected: boolean;
  port: string;
  baud: string;
  stats: {
    messagesReceived: number;
    messagesSent: number;
    errors: number;
    lastActivity: string | null;
  };
}

export interface LoRaMessageEvent {
  message?: Message;
  rssi?: number;
  msgId?: string;
  persisted: boolean;
  sender?: string;
  receiver?: string;
  content?: string;
  timestamp?: string;
}

/* ─── API Responses ────────────────────────────────────────── */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface ChatsResponse {
  success: boolean;
  chats: Chat[];
  count: number;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  count: number;
}

/* ─── UI State ─────────────────────────────────────────────── */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface SendMessagePayload {
  chatId: string;
  receiverId: string;
  content: string;
  mode: CommunicationMode;
  replyTo?: string;
  clientId?: string;
}
