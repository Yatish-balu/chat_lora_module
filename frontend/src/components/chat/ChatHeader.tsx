/**
 * ChatHeader.tsx — Top bar for active chat window
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Video, MoreVertical, ArrowLeft, Wifi, Radio } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

interface ChatHeaderProps {
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onBack }) => {
  const { activeChat, typingUsers } = useChatStore();
  const { user, mode } = useAuthStore();

  if (!activeChat) return null;

  const otherUser = activeChat.participants.find((p) => p._id !== user?._id);
  if (!otherUser) return null;

  const typing = typingUsers[activeChat._id] || [];
  const isTyping = typing.length > 0;

  const modeIcon = {
    online: <Wifi size={14} className="text-success" />,
    lora: <Radio size={14} className="text-accent" />,
    hybrid: <span className="text-xs text-warning">⚡</span>,
  }[mode];

  const modeLabel = {
    online: 'Online',
    lora: 'LoRa',
    hybrid: 'Hybrid',
  }[mode];

  return (
    <div className="glass-dark border-b border-white/5 px-4 py-3 flex items-center gap-3">
      {/* Back button (mobile) */}
      {onBack && (
        <button onClick={onBack} className="btn-icon md:hidden">
          <ArrowLeft size={20} />
        </button>
      )}

      {/* Avatar */}
      <Avatar
        src={otherUser.avatar}
        username={otherUser.displayName || otherUser.username}
        size="md"
        status={otherUser.status}
        showStatus
      />

      {/* User info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">
          {otherUser.displayName || otherUser.username}
        </h3>
        <div className="flex items-center gap-1.5">
          {isTyping ? (
            <motion.p
              className="text-xs text-primary-400 font-medium"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              typing...
            </motion.p>
          ) : (
            <p
              className={clsx('text-xs', {
                'text-success': otherUser.status === 'online',
                'text-warning': otherUser.status === 'away',
                'text-gray-500': otherUser.status === 'offline',
              })}
            >
              {otherUser.status === 'online'
                ? 'Online'
                : otherUser.status === 'away'
                ? 'Away'
                : `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
            </p>
          )}
        </div>
      </div>

      {/* Mode badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
        {modeIcon}
        {modeLabel}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button className="btn-icon hidden md:block" title="Voice call (coming soon)">
          <Phone size={18} />
        </button>
        <button className="btn-icon hidden md:block" title="Video call (coming soon)">
          <Video size={18} />
        </button>
        <button className="btn-icon" title="More options">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};
