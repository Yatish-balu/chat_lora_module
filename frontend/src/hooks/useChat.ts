/**
 * useChat.ts — Hook for sending messages and typing events
 */

import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getSocket } from '../socket/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import type { Message, MessageStatus } from '../types';

export const useChat = () => {
  const socket = getSocket();
  const { user, mode } = useAuthStore();
  const { activeChat, addMessage } = useChatStore();
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !activeChat || !user || !socket) return;

      const receiverId = activeChat.participants.find(
        (p) => p._id !== user._id
      )?._id;

      if (!receiverId) return;

      const clientId = uuidv4();

      // Optimistic update — show message immediately in UI
      const optimisticMsg: Message = {
        _id: clientId, // temp id
        chat: activeChat._id,
        sender: user as any,
        receiver: activeChat.participants.find((p) => p._id === receiverId) as any,
        content: content.trim(),
        mode,
        status: 'pending',
        clientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addMessage(optimisticMsg);

      // Emit to socket
      socket.emit('send_message', {
        chatId: activeChat._id,
        receiverId,
        content: content.trim(),
        mode,
        clientId,
      });

      // Stop typing indicator
      stopTyping();
    },
    [socket, activeChat, user, mode, addMessage]
  );

  const startTyping = useCallback(() => {
    if (!socket || !activeChat || !user) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', {
        chatId: activeChat._id,
        receiverId: activeChat.participants.find((p) => p._id !== user._id)?._id,
      });
    }

    // Auto-stop after 3 seconds of inactivity
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, activeChat, user]);

  const stopTyping = useCallback(() => {
    if (!socket || !activeChat) return;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('stop_typing', { chatId: activeChat._id });
    }

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
  }, [socket, activeChat]);

  const markChatRead = useCallback(() => {
    if (!socket || !activeChat || !user) return;

    const sender = activeChat.participants.find((p) => p._id !== user._id);
    if (sender) {
      socket.emit('message_read', {
        chatId: activeChat._id,
        senderId: sender._id,
      });
    }
  }, [socket, activeChat, user]);

  return { sendMessage, startTyping, stopTyping, markChatRead };
};
