/**
 * ChatList.tsx — List of recent chats in the sidebar
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { Radio, Wifi } from 'lucide-react';
import { clsx } from 'clsx';
import type { Chat } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface ChatListProps {
  chats: Chat[];
}

export const ChatList: React.FC<ChatListProps> = ({ chats }) => {
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, fetchMessages, markActiveChatRead } = useChatStore();

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    fetchMessages(chat._id);
    markActiveChatRead();
  };

  if (chats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        No chats yet. Search for users to start chatting!
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {chats.map((chat, idx) => {
        const otherUser = chat.participants.find((p) => p._id !== user?._id);
        if (!otherUser) return null;

        const isActive = activeChat?._id === chat._id;
        const unread = chat.myUnread || 0;
        const lastMsg = chat.lastMessage;
        const modeIcon = lastMsg?.mode === 'lora'
          ? <Radio size={10} className="text-accent flex-shrink-0" />
          : <Wifi size={10} className="text-gray-600 flex-shrink-0" />;

        const timeStr = lastMsg?.timestamp
          ? isToday(new Date(lastMsg.timestamp))
            ? format(new Date(lastMsg.timestamp), 'HH:mm')
            : format(new Date(lastMsg.timestamp), 'dd/MM')
          : '';

        return (
          <motion.div
            key={chat._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            onClick={() => handleSelectChat(chat)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer',
              'transition-all duration-200 group',
              isActive
                ? 'bg-primary-500/15 border border-primary-500/20'
                : 'hover:bg-white/5'
            )}
          >
            {/* Avatar */}
            <Avatar
              src={otherUser.avatar}
              username={otherUser.displayName || otherUser.username}
              size="md"
              status={otherUser.status}
              showStatus
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={clsx('font-medium text-sm truncate', isActive ? 'text-white' : 'text-gray-200')}>
                  {otherUser.displayName || otherUser.username}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {modeIcon}
                  <span className="text-[10px] text-gray-600">{timeStr}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 truncate max-w-[140px]">
                  {lastMsg?.content || 'Say hello!'}
                </span>
                {unread > 0 && (
                  <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
