/**
 * UserCard.tsx — Reusable user card for sidebars and search results
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import type { User } from '../../types';
import { Avatar } from '../common/Avatar';

interface UserCardProps {
  user: User;
  onClick?: () => void;
  compact?: boolean;
  showChatButton?: boolean;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onClick,
  compact = false,
  showChatButton = false,
  className,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer group',
        compact ? 'p-2' : 'p-3',
        'hover:bg-white/5',
        className
      )}
    >
      <Avatar
        src={user.avatar}
        username={user.displayName || user.username}
        size={compact ? 'sm' : 'md'}
        status={user.status}
        showStatus
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user.displayName || user.username}
        </p>
        {!compact && (
          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        )}
        {!compact && (
          <p
            className={clsx('text-xs', {
              'text-success': user.status === 'online',
              'text-warning': user.status === 'away',
              'text-gray-600': user.status === 'offline',
            })}
          >
            {user.status === 'online'
              ? '🟢 Online'
              : user.status === 'away'
              ? '🟡 Away'
              : '⚫ Offline'}
          </p>
        )}
      </div>

      {showChatButton && (
        <button className="opacity-0 group-hover:opacity-100 transition-opacity btn-icon p-1.5">
          <MessageSquare size={15} />
        </button>
      )}
    </motion.div>
  );
};
