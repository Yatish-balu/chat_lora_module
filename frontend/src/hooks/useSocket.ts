/**
 * useSocket.ts
 * ─────────────────────────────────────────────────────────────
 * Registers all Socket.IO event listeners.
 * Call once at the top of the Chat layout.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { getSocket } from '../socket/socket';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import type {
  Message,
  UserOnlineEvent,
  UserOfflineEvent,
  TypingEvent,
  MessageStatusEvent,
  LoRaStatusEvent,
  LoRaMessageEvent,
} from '../types';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const socket = getSocket();
  const { user } = useAuthStore();
  const {
    addMessage,
    updateMessageStatus,
    setOnlineUsers,
    updateUserStatus,
    setTyping,
    activeChat,
    markActiveChatRead,
  } = useChatStore();
  const { setLoraStatus, incrementStat } = useUIStore();

  // Track which chats we've joined
  const joinedChats = useRef<Set<string>>(new Set());

  // Join active chat room
  useEffect(() => {
    if (!socket || !activeChat) return;
    const chatId = activeChat._id;

    if (!joinedChats.current.has(chatId)) {
      socket.emit('join_chat', { chatId });
      joinedChats.current.add(chatId);
    }
  }, [socket, activeChat]);

  useEffect(() => {
    if (!socket || !user) return;

    // ─── Online users list (initial) ─────────────────────
    const handleOnlineUsers = (users: typeof user[]) => {
      useChatStore.getState().setOnlineUsers(users as any);
    };

    // ─── User came online ────────────────────────────────
    const handleUserOnline = (data: UserOnlineEvent) => {
      if (data.userId !== user._id) {
        updateUserStatus(data.userId, 'online');
      }
    };

    // ─── User went offline ───────────────────────────────
    const handleUserOffline = (data: UserOfflineEvent) => {
      updateUserStatus(data.userId, 'offline');
    };

    // ─── Receive a new message ───────────────────────────
    const handleReceiveMessage = (message: Message) => {
      addMessage(message);
      incrementStat('messagesSent');

      // If message is in the active chat, mark as read immediately
      const { activeChat: ac } = useChatStore.getState();
      if (ac && message.chat === ac._id) {
        markActiveChatRead();
        socket.emit('message_read', {
          chatId: message.chat,
          senderId: message.sender._id,
        });
      } else {
        // Show toast for messages in other chats
        const senderName =
          typeof message.sender === 'object'
            ? message.sender.displayName || message.sender.username
            : 'Someone';
        toast(`💬 ${senderName}: ${message.content.substring(0, 50)}`, {
          style: {
            background: '#1F2937',
            color: '#fff',
            border: '1px solid rgba(124,58,237,0.3)',
          },
        });
      }
    };

    // ─── Message sent confirmation ───────────────────────
    const handleMessageSent = (data: { clientId: string; message: Message }) => {
      if (data.message) {
        addMessage(data.message);
        updateMessageStatus(data.message.chat, data.clientId, 'sent');
      }
    };

    // ─── Message delivered ───────────────────────────────
    const handleMessageDelivered = (data: MessageStatusEvent) => {
      if (data.messageId && data.chatId) {
        updateMessageStatus(data.chatId, data.messageId, 'delivered');
      } else if (data.chatId) {
        useChatStore.getState().updateAllStatus(data.chatId, 'delivered');
      }
      incrementStat('messagesDelivered');
    };

    // ─── Message read ────────────────────────────────────
    const handleMessageRead = (data: MessageStatusEvent) => {
      if (data.chatId) {
        useChatStore.getState().updateAllStatus(data.chatId, 'read');
      }
      incrementStat('messagesRead');
    };

    // ─── Typing ──────────────────────────────────────────
    const handleTyping = (data: TypingEvent) => {
      if (data.userId !== user._id) {
        setTyping(data.chatId, data.username, true);
      }
    };

    const handleStopTyping = (data: { userId: string; chatId: string }) => {
      // We need username — derive from allUsers
      const allUsers = useChatStore.getState().allUsers;
      const typingUser = allUsers.find((u) => u._id === data.userId);
      if (typingUser) {
        setTyping(data.chatId, typingUser.username, false);
      }
    };

    // ─── LoRa events ─────────────────────────────────────
    const handleLoraStatus = (status: LoRaStatusEvent) => {
      setLoraStatus(status);
    };

    const handleLoraMessage = (data: LoRaMessageEvent) => {
      if (data.persisted && data.message) {
        addMessage(data.message);
        toast(`📡 LoRa: ${data.message.content.substring(0, 50)} (RSSI: ${data.rssi}dBm)`, {
          icon: '📡',
          style: {
            background: '#1F2937',
            color: '#00E5FF',
            border: '1px solid rgba(0,229,255,0.3)',
          },
        });
      }
    };

    // ─── User status change ──────────────────────────────
    const handleStatusChange = (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
      updateUserStatus(data.userId, data.status);
    };

    // Register all listeners
    socket.on('online_users', handleOnlineUsers);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('lora_status', handleLoraStatus);
    socket.on('lora_message', handleLoraMessage);
    socket.on('user_status_change', handleStatusChange);

    // Cleanup
    return () => {
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('lora_status', handleLoraStatus);
      socket.off('lora_message', handleLoraMessage);
      socket.off('user_status_change', handleStatusChange);
    };
  }, [socket, user]);
};
